import { Request, Response } from 'express';
import { PrismaClient, CallDirection, CallDisposition } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCallRecords(req: Request, res: Response): Promise<void> {
  const {
    page = '1',
    limit = '50',
    direction,
    disposition,
    source,
    destination,
    startDate,
    endDate,
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const take = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * take;

  const where: any = {};

  if (direction && Object.values(CallDirection).includes(direction as any)) {
    where.direction = direction;
  }

  if (disposition && Object.values(CallDisposition).includes(disposition as any)) {
    where.disposition = disposition;
  }

  if (source) {
    where.OR = [
      { sourceExtension: { contains: source as string } },
      { callerIdNum: { contains: source as string } },
    ];
  }

  if (destination) {
    where.destination = { contains: destination as string };
  }

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate as string);
    if (endDate) where.startTime.lte = new Date(endDate as string);
  }

  try {
    const [total, records] = await Promise.all([
      prisma.callRecord.count({ where }),
      prisma.callRecord.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'desc' },
        include: {
          recording: { select: { id: true, duration: true, fileSize: true, format: true } },
          trunk: { select: { id: true, name: true } },
        },
      }),
    ]);

    const sanitized = records.map((r) => ({
      ...r,
      uuid: r.callUuid,
      durationSeconds: r.duration,
      billsecSeconds: r.billsec,
      recording: r.recording
        ? {
            ...r.recording,
            fileSize: Number(r.recording.fileSize),
          }
        : null,
    }));

    res.json({
      records: sanitized,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve call records', details: err.message });
  }
}

export async function exportCdrCsv(req: Request, res: Response): Promise<void> {
  try {
    const records = await prisma.callRecord.findMany({
      orderBy: { startTime: 'desc' },
      take: 1000,
    });

    const headers = [
      'Call UUID',
      'Direction',
      'Caller ID',
      'Caller Name',
      'Destination',
      'Disposition',
      'Start Time',
      'Answer Time',
      'End Time',
      'Duration (sec)',
      'Talk Time (sec)',
      'Hangup Cause',
      'Has Recording',
    ];

    const rows = records.map((r) => [
      `"${r.callUuid}"`,
      `"${r.direction}"`,
      `"${r.callerIdNum}"`,
      `"${r.callerIdName || ''}"`,
      `"${r.destination}"`,
      `"${r.disposition}"`,
      `"${r.startTime.toISOString()}"`,
      `"${r.answerTime ? r.answerTime.toISOString() : ''}"`,
      `"${r.endTime.toISOString()}"`,
      r.duration,
      r.billsec,
      `"${r.hangupCause}"`,
      r.hasRecording ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="eclype_tech_pbx_cdr_export.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export CDR CSV', details: err.message });
  }
}
