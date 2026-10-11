import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getVoicemailBoxes(req: Request, res: Response): Promise<void> {
  try {
    const boxes = await prisma.voicemailBox.findMany({
      include: {
        extension: {
          select: {
            id: true,
            extensionNumber: true,
            displayName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { mailbox: 'asc' },
    });
    res.json({ voicemailBoxes: boxes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve voicemail boxes', details: err.message });
  }
}

export async function updateVoicemailBox(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { pin, emailNotification, attachAudio } = req.body;

  try {
    const updated = await prisma.voicemailBox.update({
      where: { id },
      data: {
        pin: pin !== undefined ? String(pin) : undefined,
        emailNotification: emailNotification !== undefined ? emailNotification : undefined,
        attachAudio: attachAudio !== undefined ? !!attachAudio : undefined,
      },
      include: { extension: true },
    });
    res.json({ voicemailBox: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update voicemail box', details: err.message });
  }
}
