import { Request, Response } from 'express';
import { PrismaClient, SecurityEventType, Severity } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const prisma = new PrismaClient();

export async function getSecurityOverview(req: Request, res: Response): Promise<void> {
  try {
    const recentEvents = await prisma.securityEvent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const failedLogins24h = await prisma.user.aggregate({
      _sum: { failedLoginAttempts: true },
    });

    // Check Fail2ban status
    let bannedIps: string[] = [];
    try {
      const { stdout } = await execAsync('fail2ban-client status freeswitch 2>/dev/null');
      const match = stdout.match(/Banned IP list:\s*(.*)/);
      if (match && match[1]) {
        bannedIps = match[1].trim().split(/\s+/).filter(Boolean);
      }
    } catch (err) {
      // fail2ban may be inactive
    }

    res.json({
      overview: {
        totalSecurityEvents: await prisma.securityEvent.count(),
        unresolvedEvents: await prisma.securityEvent.count({ where: { resolved: false } }),
        totalFailedLogins: failedLogins24h._sum.failedLoginAttempts || 0,
        bannedIpsCount: bannedIps.length,
        bannedIps,
      },
      recentEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve security overview', details: err.message });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '50', action, resource } = req.query;
  const pageNum = parseInt(page as string, 10);
  const take = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * take;

  const where: any = {};
  if (action) where.action = { contains: action as string };
  if (resource) where.resource = { contains: resource as string };

  try {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      auditLogs: logs,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: err.message });
  }
}

export async function getSecurityEvents(req: Request, res: Response): Promise<void> {
  try {
    const events = await prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve security events', details: err.message });
  }
}

export async function resolveSecurityEvent(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const event = await prisma.securityEvent.update({
      where: { id },
      data: { resolved: true },
    });
    res.json({ event });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve security event', details: err.message });
  }
}
