import { Request, Response } from 'express';
import { PrismaClient, DestinationType, OutboundClass } from '@prisma/client';

const prisma = new PrismaClient();

// ----------------- Inbound Routes -----------------

export async function getInboundRoutes(req: Request, res: Response): Promise<void> {
  try {
    const routes = await prisma.inboundRoute.findMany({
      include: { trunk: { select: { id: true, name: true, provider: true } } },
      orderBy: { priority: 'asc' },
    });
    res.json({ routes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve inbound routes', details: err.message });
  }
}

export async function createInboundRoute(req: Request, res: Response): Promise<void> {
  const {
    name,
    didNumber,
    trunkId,
    timeConditionEnabled,
    businessHoursStart,
    businessHoursEnd,
    businessDays,
    destinationType,
    destinationTarget,
    afterHoursDestinationType,
    afterHoursTarget,
    recordCalls,
    priority,
    enabled,
  } = req.body;

  if (!name || !didNumber || !destinationType || !destinationTarget) {
    res.status(400).json({ error: 'Name, DID number, destination type and destination target are required' });
    return;
  }

  // Prevent routing loop: Inbound route cannot route to itself
  if (destinationType === DestinationType.EXTERNAL && destinationTarget === didNumber) {
    res.status(400).json({ error: 'Routing loop detected: Destination cannot be identical to DID number' });
    return;
  }

  try {
    const route = await prisma.inboundRoute.create({
      data: {
        name,
        didNumber,
        trunkId: trunkId || null,
        timeConditionEnabled: !!timeConditionEnabled,
        businessHoursStart: businessHoursStart || '09:00',
        businessHoursEnd: businessHoursEnd || '17:00',
        businessDays: businessDays || 'MON,TUE,WED,THU,FRI',
        destinationType,
        destinationTarget,
        afterHoursDestinationType: afterHoursDestinationType || null,
        afterHoursTarget: afterHoursTarget || null,
        recordCalls: !!recordCalls,
        priority: priority || 10,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    res.status(201).json({ route });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create inbound route', details: err.message });
  }
}

export async function updateInboundRoute(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const data = req.body;

  try {
    const route = await prisma.inboundRoute.update({
      where: { id },
      data,
    });
    res.json({ route });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update inbound route', details: err.message });
  }
}

export async function deleteInboundRoute(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await prisma.inboundRoute.delete({ where: { id } });
    res.json({ message: 'Inbound route deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete inbound route', details: err.message });
  }
}

// ----------------- Outbound Routes -----------------

export async function getOutboundRoutes(req: Request, res: Response): Promise<void> {
  try {
    const routes = await prisma.outboundRoute.findMany({
      include: {
        primaryTrunk: { select: { id: true, name: true, provider: true } },
        failoverTrunk: { select: { id: true, name: true, provider: true } },
      },
      orderBy: { priority: 'asc' },
    });
    res.json({ routes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve outbound routes', details: err.message });
  }
}

export async function createOutboundRoute(req: Request, res: Response): Promise<void> {
  const {
    name,
    dialPattern,
    stripDigits,
    prependDigits,
    primaryTrunkId,
    failoverTrunkId,
    allowedClass,
    customCallerId,
    maxCallDuration,
    priority,
    enabled,
  } = req.body;

  if (!name || !dialPattern || !primaryTrunkId) {
    res.status(400).json({ error: 'Name, dial pattern, and primary trunk ID are required' });
    return;
  }

  // Validate Regex syntax
  try {
    new RegExp(dialPattern);
  } catch (err) {
    res.status(400).json({ error: 'Invalid dial pattern regular expression' });
    return;
  }

  try {
    const route = await prisma.outboundRoute.create({
      data: {
        name,
        dialPattern,
        stripDigits: stripDigits || 0,
        prependDigits: prependDigits || null,
        primaryTrunkId,
        failoverTrunkId: failoverTrunkId || null,
        allowedClass: allowedClass || OutboundClass.LOCAL,
        customCallerId: customCallerId || null,
        maxCallDuration: maxCallDuration || null,
        priority: priority || 10,
        enabled: enabled !== undefined ? enabled : true,
      },
      include: {
        primaryTrunk: true,
        failoverTrunk: true,
      },
    });

    res.status(201).json({ route });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create outbound route', details: err.message });
  }
}

export async function updateOutboundRoute(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const data = req.body;

  try {
    const route = await prisma.outboundRoute.update({
      where: { id },
      data,
      include: {
        primaryTrunk: true,
        failoverTrunk: true,
      },
    });
    res.json({ route });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update outbound route', details: err.message });
  }
}

export async function deleteOutboundRoute(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await prisma.outboundRoute.delete({ where: { id } });
    res.json({ message: 'Outbound route deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete outbound route', details: err.message });
  }
}
