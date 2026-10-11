import { Request, Response } from 'express';
import { PrismaClient, DestinationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function getIvrMenus(req: Request, res: Response): Promise<void> {
  try {
    const menus = await prisma.ivrMenu.findMany({
      include: { options: { orderBy: { digit: 'asc' } } },
      orderBy: { extensionNumber: 'asc' },
    });
    res.json({ ivrMenus: menus });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve IVR menus', details: err.message });
  }
}

export async function createIvrMenu(req: Request, res: Response): Promise<void> {
  const {
    name,
    extensionNumber,
    audioPromptFile,
    timeout,
    maxAttempts,
    timeoutDestType,
    timeoutTarget,
    invalidDestType,
    invalidTarget,
    options,
  } = req.body;

  if (!name || !extensionNumber || !audioPromptFile) {
    res.status(400).json({ error: 'Name, extension number, and audio prompt file are required' });
    return;
  }

  try {
    const menu = await prisma.ivrMenu.create({
      data: {
        name,
        extensionNumber,
        audioPromptFile,
        timeout: timeout || 5,
        maxAttempts: maxAttempts || 3,
        timeoutDestType: timeoutDestType || DestinationType.VOICEMAIL,
        timeoutTarget: timeoutTarget || '1000',
        invalidDestType: invalidDestType || DestinationType.VOICEMAIL,
        invalidTarget: invalidTarget || '1000',
        options: {
          create: Array.isArray(options)
            ? options.map((opt: any) => ({
                digit: String(opt.digit),
                destinationType: opt.destinationType,
                destinationTarget: opt.destinationTarget,
                description: opt.description || null,
              }))
            : [],
        },
      },
      include: { options: true },
    });

    res.status(201).json({ ivrMenu: menu });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create IVR menu', details: err.message });
  }
}

export async function updateIvrMenu(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const {
    name,
    audioPromptFile,
    timeout,
    maxAttempts,
    timeoutDestType,
    timeoutTarget,
    invalidDestType,
    invalidTarget,
    enabled,
    options,
  } = req.body;

  try {
    const existing = await prisma.ivrMenu.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'IVR menu not found' });
      return;
    }

    // Update menu properties
    await prisma.ivrMenu.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        audioPromptFile: audioPromptFile ?? existing.audioPromptFile,
        timeout: timeout ?? existing.timeout,
        maxAttempts: maxAttempts ?? existing.maxAttempts,
        timeoutDestType: timeoutDestType ?? existing.timeoutDestType,
        timeoutTarget: timeoutTarget ?? existing.timeoutTarget,
        invalidDestType: invalidDestType ?? existing.invalidDestType,
        invalidTarget: invalidTarget ?? existing.invalidTarget,
        enabled: enabled !== undefined ? enabled : existing.enabled,
      },
    });

    // Replace options if provided
    if (Array.isArray(options)) {
      await prisma.ivrOption.deleteMany({ where: { ivrMenuId: id } });
      await prisma.ivrOption.createMany({
        data: options.map((opt: any) => ({
          ivrMenuId: id,
          digit: String(opt.digit),
          destinationType: opt.destinationType,
          destinationTarget: opt.destinationTarget,
          description: opt.description || null,
        })),
      });
    }

    const result = await prisma.ivrMenu.findUnique({
      where: { id },
      include: { options: { orderBy: { digit: 'asc' } } },
    });

    res.json({ ivrMenu: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update IVR menu', details: err.message });
  }
}

export async function deleteIvrMenu(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    await prisma.ivrMenu.delete({ where: { id } });
    res.json({ message: 'IVR menu deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete IVR menu', details: err.message });
  }
}
