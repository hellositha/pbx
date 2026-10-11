import { Request, Response } from 'express';
import { PrismaClient, BackupStatus } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config/environment';
import { getSystemMetrics } from '../utils/system-stats';
import { eslClient } from '../telephony/esl-client';

const execAsync = util.promisify(exec);
const prisma = new PrismaClient();

export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    const metrics = await getSystemMetrics();
    res.json({ health: metrics, stats: metrics });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect system health', details: err.message });
  }
}

export async function getNetworkSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'NETWORK' },
    });
    res.json({ networkSettings: settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve network settings', details: err.message });
  }
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve settings', details: err.message });
  }
}

export async function updateSetting(req: Request, res: Response): Promise<void> {
  const key = req.params.key as string;
  const { value } = req.body;

  if (value === undefined) {
    res.status(400).json({ error: 'Setting value is required' });
    return;
  }

  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), category: 'SYSTEM' },
    });
    res.json({ setting: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update setting', details: err.message });
  }
}

export async function getBackups(req: Request, res: Response): Promise<void> {
  try {
    const backups = await prisma.backupJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const sanitized = backups.map((b) => ({
      ...b,
      fileSize: Number(b.fileSize),
    }));
    res.json({ backups: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve backups', details: err.message });
  }
}

export async function triggerBackup(req: Request, res: Response): Promise<void> {
  const { includeRecordings = false } = req.body;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `eclypetech_pbx_backup_${timestamp}.tar.gz`;
  const backupDir = config.asterisk.backupsDir;
  const backupPath = path.join(backupDir, filename);
  const tempDir = path.join('/tmp', `backup_${timestamp}`);

  try {
    // 1. Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // 2. Dump PostgreSQL database
    const dumpPath = path.join(tempDir, 'database.sql');
    await execAsync(`PGPASSWORD='EclypeTechDB2026!' pg_dump -h 127.0.0.1 -U eclypetech eclypetech_pbx > "${dumpPath}"`);

    // 3. Copy Asterisk configs
    const confDest = path.join(tempDir, 'conf');
    fs.mkdirSync(confDest, { recursive: true });
    await execAsync(`cp -r /etc/asterisk/* "${confDest}/" 2>/dev/null || true`);

    // 4. Archive temp folder to .tar.gz
    await execAsync(`tar -czf "${backupPath}" -C "${tempDir}" .`);

    // 5. Cleanup temp folder
    await execAsync(`rm -rf "${tempDir}"`);

    // 6. Compute SHA-256 checksum & file size
    const stat = fs.statSync(backupPath);
    const fileBuffer = fs.readFileSync(backupPath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 7. Record in database
    const job = await prisma.backupJob.create({
      data: {
        filename,
        filePath: backupPath,
        fileSize: BigInt(stat.size),
        includesRecordings: !!includeRecordings,
        status: BackupStatus.SUCCESS,
        checksum,
      },
    });

    res.status(201).json({
      message: 'Backup completed successfully',
      backup: {
        id: job.id,
        filename: job.filename,
        sizeBytes: stat.size,
        checksum,
        createdAt: job.createdAt,
      },
    });
  } catch (err: any) {
    // Record failed attempt
    await prisma.backupJob.create({
      data: {
        filename,
        filePath: backupPath,
        fileSize: BigInt(0),
        status: BackupStatus.FAILED,
        checksum: 'ERROR',
      },
    });

    res.status(500).json({ error: 'Backup process failed', details: err.message });
  }
}

export async function reloadTelephony(req: Request, res: Response): Promise<void> {
  try {
    let output = '';

    if (eslClient.isReady()) {
      output = await eslClient.reloadXml();
    } else {
      const { stdout } = await execAsync('asterisk -rx "pjsip reload" && asterisk -rx "dialplan reload"');
      output = stdout;
    }

    res.json({
      success: true,
      message: 'Asterisk PJSIP dialplans and configurations reloaded successfully',
      output: (output || '+OK [Asterisk PJSIP & Dialplan Reloaded]').trim(),
    });
  } catch (err: any) {
    console.error('[Telephony] Reload failed:', err);
    res.status(500).json({
      error: 'Failed to reload Asterisk configuration',
      details: err.message,
    });
  }
}
