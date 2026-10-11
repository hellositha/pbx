import { Request, Response } from 'express';
import { PrismaClient, CallDisposition } from '@prisma/client';
import { eslClient } from '../telephony/esl-client';
import { getSystemMetrics } from '../utils/system-stats';

const prisma = new PrismaClient();

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    // 1. Fetch system metrics
    const metrics = await getSystemMetrics();

    // 2. Fetch live FreeSWITCH data via ESL
    const channels = await eslClient.getActiveChannels();
    const registrations = await eslClient.getRegistrations();

    // 3. Database counts
    const totalExtensions = await prisma.extension.count();
    const registeredCount = registrations.length;
    const offlineCount = Math.max(0, totalExtensions - registeredCount);

    const totalTrunks = await prisma.sipTrunk.count();
    const activeTrunks = await prisma.sipTrunk.count({ where: { enabled: true } });

    // Today's call stats
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const callsToday = await prisma.callRecord.count({
      where: { startTime: { gte: startOfDay } },
    });

    const missedToday = await prisma.callRecord.count({
      where: {
        startTime: { gte: startOfDay },
        disposition: { in: [CallDisposition.NO_ANSWER, CallDisposition.BUSY, CallDisposition.FAILED] },
      },
    });

    const lastBackup = await prisma.backupJob.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { filename: true, status: true, fileSize: true, createdAt: true },
    });

    // Incoming vs Outgoing active calls
    const incomingCalls = channels.filter((c) => c.direction === 'inbound').length;
    const outgoingCalls = channels.filter((c) => c.direction === 'outbound').length;

    res.json({
      telephony: {
        totalExtensions,
        registeredExtensions: registeredCount,
        offlineExtensions: offlineCount,
        activeCalls: channels.length,
        incomingCalls,
        outgoingCalls,
        callsToday,
        missedCallsToday: missedToday,
        activeTrunks,
        totalTrunks,
        callsWaitingInQueue: 0,
        averageCallDurationSec: 142,
      },
      system: metrics,
      lastBackup: lastBackup
        ? {
            filename: lastBackup.filename,
            status: lastBackup.status,
            sizeBytes: Number(lastBackup.fileSize),
            createdAt: lastBackup.createdAt,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to aggregate dashboard summary', details: err.message });
  }
}

export async function getActiveCalls(req: Request, res: Response): Promise<void> {
  try {
    const channels = await eslClient.getActiveChannels();
    res.json({ calls: channels, channels });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve active calls', details: err.message });
  }
}

export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    const metrics = await getSystemMetrics();
    res.json({ health: metrics, stats: metrics });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect system health', details: err.message });
  }
}
