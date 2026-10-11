import { Request, Response } from 'express';
import { PrismaClient, QueueStrategy, DestinationType, AgentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function getQueues(req: Request, res: Response): Promise<void> {
  try {
    const queues = await prisma.callQueue.findMany({
      include: {
        agents: {
          include: {
            extension: {
              select: { id: true, extensionNumber: true, displayName: true },
            },
          },
          orderBy: { tier: 'asc' },
        },
      },
      orderBy: { queueNumber: 'asc' },
    });
    res.json({ queues });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve call queues', details: err.message });
  }
}

export async function createQueue(req: Request, res: Response): Promise<void> {
  const {
    queueNumber,
    name,
    strategy,
    maxWaitTime,
    maxQueueSize,
    musicOnHold,
    wrapUpTime,
    overflowDestType,
    overflowTarget,
    agentExtensionIds,
  } = req.body;

  if (!queueNumber || !name) {
    res.status(400).json({ error: 'Queue number and name are required' });
    return;
  }

  try {
    const queue = await prisma.callQueue.create({
      data: {
        queueNumber,
        name,
        strategy: strategy || QueueStrategy.LONGEST_IDLE_AGENT,
        maxWaitTime: maxWaitTime || 300,
        maxQueueSize: maxQueueSize || 20,
        musicOnHold: musicOnHold || 'local_stream://moh',
        wrapUpTime: wrapUpTime || 15,
        overflowDestType: overflowDestType || DestinationType.VOICEMAIL,
        overflowTarget: overflowTarget || '1000',
        agents: {
          create: Array.isArray(agentExtensionIds)
            ? agentExtensionIds.map((extId: string, idx: number) => ({
                extensionId: extId,
                tier: Math.floor(idx / 3) + 1,
                status: AgentStatus.LOGGED_IN,
              }))
            : [],
        },
      },
      include: { agents: { include: { extension: true } } },
    });

    res.status(201).json({ queue });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create call queue', details: err.message });
  }
}

export async function updateQueue(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const {
    name,
    strategy,
    maxWaitTime,
    maxQueueSize,
    wrapUpTime,
    overflowDestType,
    overflowTarget,
    enabled,
    agentExtensionIds,
  } = req.body;

  try {
    await prisma.callQueue.update({
      where: { id },
      data: {
        name,
        strategy,
        maxWaitTime,
        maxQueueSize,
        wrapUpTime,
        overflowDestType,
        overflowTarget,
        enabled,
      },
    });

    if (Array.isArray(agentExtensionIds)) {
      await prisma.queueAgent.deleteMany({ where: { callQueueId: id } });
      await prisma.queueAgent.createMany({
        data: agentExtensionIds.map((extId: string, idx: number) => ({
          callQueueId: id,
          extensionId: extId,
          tier: Math.floor(idx / 3) + 1,
          status: AgentStatus.LOGGED_IN,
        })),
      });
    }

    const updated = await prisma.callQueue.findUnique({
      where: { id },
      include: { agents: { include: { extension: true }, orderBy: { tier: 'asc' } } },
    });

    res.json({ queue: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update call queue', details: err.message });
  }
}

export async function updateAgentStatus(req: Request, res: Response): Promise<void> {
  const queueId = req.params.queueId as string;
  const extensionId = req.params.extensionId as string;
  const { status } = req.body;

  if (!status || !Object.values(AgentStatus).includes(status)) {
    res.status(400).json({ error: 'Valid agent status is required' });
    return;
  }

  try {
    const updated = await prisma.queueAgent.update({
      where: {
        callQueueId_extensionId: {
          callQueueId: queueId,
          extensionId: extensionId,
        },
      },
      data: { status },
      include: { extension: true },
    });

    res.json({ agent: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update agent status', details: err.message });
  }
}

export async function deleteQueue(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  try {
    await prisma.queueAgent.deleteMany({ where: { callQueueId: id } });
    await prisma.callQueue.delete({ where: { id } });
    res.json({ success: true, message: 'Queue deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete call queue', details: err.message });
  }
}
