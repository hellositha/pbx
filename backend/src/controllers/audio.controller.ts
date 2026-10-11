import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const SOUNDS_DIR = '/var/lib/asterisk/sounds/custom';
const INDEX_FILE = path.join(SOUNDS_DIR, 'audio_prompts_index.json');

// Ensure sounds directory exists
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

export interface AudioPromptMetadata {
  id: string;
  filename: string;
  label: string;
  category: 'IVR_PROMPT' | 'MOH' | 'QUEUE_ANNOUNCEMENT' | 'VOICEMAIL_GREETING' | 'GENERAL';
  fileSize: number;
  format: string;
  durationSeconds?: number;
  asteriskSoundPath: string; // e.g. "custom/welcome_main"
  createdAt: string;
}

function readIndex(): AudioPromptMetadata[] {
  try {
    if (!fs.existsSync(INDEX_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('Error reading audio prompts index:', err);
    return [];
  }
}

function writeIndex(items: AudioPromptMetadata[]): void {
  try {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(items, null, 2), 'utf-8');
    // Ensure asterisk user can read the index
    try {
      execAsync(`chown asterisk:asterisk ${INDEX_FILE} && chmod 664 ${INDEX_FILE}`).catch(() => {});
    } catch {}
  } catch (err) {
    console.error('Error writing audio prompts index:', err);
  }
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(SOUNDS_DIR)) {
      fs.mkdirSync(SOUNDS_DIR, { recursive: true });
    }
    cb(null, SOUNDS_DIR);
  },
  filename: (req, file, cb) => {
    const rawName = file.originalname || 'prompt.wav';
    const ext = path.extname(rawName).toLowerCase() || '.wav';
    const base = path.basename(rawName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const uniqueSuffix = Date.now().toString().slice(-6);
    const finalName = `${base}_${uniqueSuffix}${ext}`;
    cb(null, finalName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.wav', '.mp3', '.ogg', '.gsm', '.sln', '.alaw', '.ulaw', '.m4a'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format (${ext}). Allowed: WAV, MP3, OGG, GSM`));
    }
  },
});

export async function uploadAudio(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No audio file uploaded. Ensure the form field is named "file".' });
    return;
  }

  const label = (req.body.label || req.body.name || path.basename(file.originalname, path.extname(file.originalname))).trim();
  const category = (req.body.category || 'IVR_PROMPT').toUpperCase() as AudioPromptMetadata['category'];

  const originalPath = file.path;
  const ext = path.extname(file.filename).toLowerCase();
  const baseName = path.basename(file.filename, ext);

  let finalFilename = file.filename;
  let finalPath = originalPath;
  let finalFormat = ext.replace('.', '') || 'wav';

  // If not standard WAV, or if converting to standard Asterisk 8kHz mono PCM WAV:
  const targetWavFilename = `${baseName}.wav`;
  const targetWavPath = path.join(SOUNDS_DIR, targetWavFilename);

  try {
    // Attempt conversion to standard Asterisk 8kHz 16-bit mono WAV using sox if needed
    if (ext !== '.wav' || true) {
      try {
        const tempConverted = path.join(SOUNDS_DIR, `conv_${targetWavFilename}`);
        await execAsync(`sox "${originalPath}" -r 8000 -c 1 -b 16 "${tempConverted}"`);
        if (fs.existsSync(tempConverted) && fs.statSync(tempConverted).size > 0) {
          if (fs.existsSync(originalPath) && originalPath !== tempConverted) {
            fs.unlinkSync(originalPath);
          }
          fs.renameSync(tempConverted, targetWavPath);
          finalFilename = targetWavFilename;
          finalPath = targetWavPath;
          finalFormat = 'wav';
        }
      } catch (convErr) {
        console.warn('SoX conversion skipped or unavailable, using original file:', convErr);
      }
    }

    // Set file permissions for Asterisk
    await execAsync(`chown asterisk:asterisk "${finalPath}" && chmod 644 "${finalPath}"`).catch(() => {});

    const stat = fs.statSync(finalPath);
    const asteriskSoundName = path.basename(finalFilename, path.extname(finalFilename));

    const item: AudioPromptMetadata = {
      id: 'aud-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
      filename: finalFilename,
      label: label || asteriskSoundName,
      category,
      fileSize: stat.size,
      format: finalFormat,
      asteriskSoundPath: `custom/${asteriskSoundName}`,
      createdAt: new Date().toISOString(),
    };

    const index = readIndex();
    index.unshift(item);
    writeIndex(index);

    res.status(201).json({
      success: true,
      message: 'Audio prompt uploaded and configured for Asterisk PBX',
      audio: item,
    });
  } catch (err: any) {
    console.error('Failed to process uploaded audio file:', err);
    res.status(500).json({ error: 'Failed to process audio file', details: err.message });
  }
}

export async function getAudioPrompts(req: Request, res: Response): Promise<void> {
  try {
    let index = readIndex();

    // Auto-discover any orphaned .wav files in the custom folder that may not be in index
    if (fs.existsSync(SOUNDS_DIR)) {
      const files = fs.readdirSync(SOUNDS_DIR);
      let indexModified = false;
      const indexedFilenames = new Set(index.map((i) => i.filename));

      for (const f of files) {
        if (f.endsWith('.wav') || f.endsWith('.gsm') || f.endsWith('.mp3')) {
          if (!indexedFilenames.has(f)) {
            const p = path.join(SOUNDS_DIR, f);
            const stat = fs.statSync(p);
            const base = path.basename(f, path.extname(f));
            index.push({
              id: 'aud-auto-' + Math.random().toString(36).substr(2, 6),
              filename: f,
              label: base.replace(/_/g, ' '),
              category: 'GENERAL',
              fileSize: stat.size,
              format: path.extname(f).replace('.', ''),
              asteriskSoundPath: `custom/${base}`,
              createdAt: stat.birthtime.toISOString(),
            });
            indexModified = true;
          }
        }
      }

      if (indexModified) {
        writeIndex(index);
      }
    }

    res.json({ audioList: index });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audio prompts', details: err.message });
  }
}

export async function streamAudio(req: Request, res: Response): Promise<void> {
  const rawId = (req.params.id as string) || '';
  const decodedId = decodeURIComponent(rawId).trim();
  const index = readIndex();

  let filePath = '';

  // 1. Direct match in index by ID or filename
  let item = index.find((i) => i.id === decodedId || i.filename === decodedId);

  // 2. Match by asteriskSoundPath or normalized sound name
  if (!item) {
    const cleanName = decodedId.replace(/^custom\//, '').replace(/\.(wav|mp3|ogg|gsm)$/i, '');
    item = index.find((i) => {
      const pClean = (i.asteriskSoundPath || '').replace(/^custom\//, '').replace(/\.(wav|mp3|ogg|gsm)$/i, '');
      const fClean = (i.filename || '').replace(/\.(wav|mp3|ogg|gsm)$/i, '');
      return pClean === cleanName || fClean === cleanName;
    });
  }

  if (item && fs.existsSync(path.join(SOUNDS_DIR, item.filename))) {
    filePath = path.join(SOUNDS_DIR, item.filename);
  }

  // 3. Fallback: Search directly in SOUNDS_DIR (/var/lib/asterisk/sounds/custom)
  if (!filePath) {
    const base = path.basename(decodedId);
    const candidateNames = [
      decodedId,
      `${decodedId}.wav`,
      base,
      `${base}.wav`,
      base.replace(/\.wav$/i, '') + '.wav',
    ];
    for (const c of candidateNames) {
      const testPath = path.join(SOUNDS_DIR, c);
      if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
        filePath = testPath;
        break;
      }
    }
  }

  // 4. Fallback: Search Asterisk system sounds directory tree (/var/lib/asterisk/sounds)
  if (!filePath) {
    const baseDirs = ['/var/lib/asterisk/sounds', '/var/lib/asterisk/sounds/en', '/var/lib/asterisk/sounds/ivr'];
    const candidates = [
      decodedId,
      `${decodedId}.wav`,
      path.basename(decodedId),
      `${path.basename(decodedId)}.wav`,
    ];
    for (const d of baseDirs) {
      for (const c of candidates) {
        const testPath = path.join(d, c);
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          filePath = testPath;
          break;
        }
      }
      if (filePath) break;
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Audio file not found', requested: decodedId });
    return;
  }

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.mp3'
        ? 'audio/mpeg'
        : ext === '.ogg'
        ? 'audio/ogg'
        : ext === '.gsm'
        ? 'audio/x-gsm'
        : 'audio/wav';

    // Handle HEAD request
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mime,
        'Accept-Ranges': 'bytes',
      });
      res.end();
      return;
    }

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
        });
        res.end();
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mime,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mime,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to stream audio file', details: err.message });
  }
}

export async function deleteAudio(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  try {
    const index = readIndex();
    const itemIndex = index.findIndex((i) => i.id === id || i.filename === id);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Audio prompt not found' });
      return;
    }

    const item = index[itemIndex];
    const filePath = path.join(SOUNDS_DIR, item.filename);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Failed to delete file from disk:', err);
      }
    }

    index.splice(itemIndex, 1);
    writeIndex(index);

    res.json({ success: true, message: `Audio prompt "${item.label}" deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete audio prompt', details: err.message });
  }
}
