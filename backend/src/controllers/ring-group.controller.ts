import { Request, Response } from 'express';
import { PrismaClient, RingStrategy, DestinationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function getRingGroups(req: Request, res: Response): Promise<void> {
  try {
    const groups = await prisma.ringGroup.findMany({
      include: {
        members: {
          include: {
            extension: {
              select: { id: true, extensionNumber: true, displayName: true },
            },
          },
          orderBy: { priority: 'asc' },
        },
      },
      orderBy: { groupNumber: 'asc' },
    });
    res.json({ ringGroups: groups });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve ring groups', details: err.message });
  }
}

export async function createRingGroup(req: Request, res: Response): Promise<void> {
  const {
    groupNumber,
    name,
    strategy,
    ringTimeout,
    fallbackDestType,
    fallbackTarget,
    memberExtensionIds,
  } = req.body;

  if (!groupNumber || !name) {
    res.status(400).json({ error: 'Group number and name are required' });
    return;
  }

  try {
    const group = await prisma.ringGroup.create({
      data: {
        groupNumber,
        name,
        strategy: strategy || RingStrategy.SIMULTANEOUS,
        ringTimeout: ringTimeout || 20,
        fallbackDestType: fallbackDestType || DestinationType.VOICEMAIL,
        fallbackTarget: fallbackTarget || '1000',
        members: {
          create: Array.isArray(memberExtensionIds)
            ? memberExtensionIds.map((extId: string, index: number) => ({
                extensionId: extId,
                priority: index + 1,
              }))
            : [],
        },
      },
      include: {
        members: { include: { extension: true } },
      },
    });

    res.status(201).json({ ringGroup: group });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create ring group', details: err.message });
  }
}

export async function updateRingGroup(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const {
    name,
    strategy,
    ringTimeout,
    fallbackDestType,
    fallbackTarget,
    enabled,
    memberExtensionIds,
  } = req.body;

  try {
    await prisma.ringGroup.update({
      where: { id },
      data: {
        name,
        strategy,
        ringTimeout,
        fallbackDestType,
        fallbackTarget,
        enabled,
      },
    });

    if (Array.isArray(memberExtensionIds)) {
      await prisma.ringGroupMember.deleteMany({ where: { ringGroupId: id } });
      await prisma.ringGroupMember.createMany({
        data: memberExtensionIds.map((extId: string, index: number) => ({
          ringGroupId: id,
          extensionId: extId,
          priority: index + 1,
        })),
      });
    }

    const updated = await prisma.ringGroup.findUnique({
      where: { id },
      include: {
        members: { include: { extension: true }, orderBy: { priority: 'asc' } },
      },
    });

    res.json({ ringGroup: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update ring group', details: err.message });
  }
}

export async function deleteRingGroup(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await prisma.ringGroup.delete({ where: { id } });
    res.json({ message: 'Ring group deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete ring group', details: err.message });
  }
}
