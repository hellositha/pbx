import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { generateSecureToken } from '../utils/crypto';

const prisma = new PrismaClient();

// In-memory token storage for authorized downloads (expires in 10 minutes)
const downloadTokens = new Map<string, { recordingId: string; expiresAt: number }>();

export async function getRecordings(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '50' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const take = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * take;

  try {
    const [total, recordings] = await Promise.all([
      prisma.callRecording.count(),
      prisma.callRecording.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          callRecord: {
            select: {
              callerIdNum: true,
              callerIdName: true,
              destination: true,
              direction: true,
              startTime: true,
            },
          },
        },
      }),
    ]);

    const sanitized = recordings.map((rec) => ({
      ...rec,
      fileSize: Number(rec.fileSize),
    }));

    res.json({
      recordings: sanitized,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve recordings', details: err.message });
  }
}

export async function authorizeDownload(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const recording = await prisma.callRecording.findUnique({ where: { id } });
    if (!recording) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    const token = generateSecureToken(24);
    downloadTokens.set(token, {
      recordingId: id,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes valid
    });

    res.json({
      downloadToken: token,
      downloadUrl: `/api/recordings/stream/${token}`,
      expiresInSeconds: 600,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate download authorization', details: err.message });
  }
}

export async function streamRecording(req: Request, res: Response): Promise<void> {
  const token = req.params.token as string;
  const tokenData = downloadTokens.get(token);

  if (!tokenData || tokenData.expiresAt < Date.now()) {
    res.status(403).json({ error: 'Invalid or expired recording download token' });
    return;
  }

  try {
    const recording = await prisma.callRecording.findUnique({
      where: { id: tokenData.recordingId },
    });

    if (!recording || !fs.existsSync(recording.filePath)) {
      res.status(404).json({ error: 'Recording audio file not found on disk' });
      return;
    }

    const stat = fs.statSync(recording.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(recording.filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/wav',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/wav',
        'Content-Disposition': `inline; filename="recording_${recording.id}.wav"`,
      };
      res.writeHead(200, head);
      fs.createReadStream(recording.filePath).pipe(res);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to stream audio file', details: err.message });
  }
}

export async function deleteRecording(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const recording = await prisma.callRecording.findUnique({ where: { id } });
    if (!recording) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    if (fs.existsSync(recording.filePath)) {
      try {
        fs.unlinkSync(recording.filePath);
      } catch (err) {
        // ignore disk err
      }
    }

    await prisma.callRecording.delete({ where: { id } });
    res.json({ message: 'Recording deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete recording', details: err.message });
  }
}
