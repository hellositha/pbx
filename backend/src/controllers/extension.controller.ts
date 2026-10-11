import { Request, Response } from 'express';
import { PrismaClient, OutboundClass, RecordPolicy } from '@prisma/client';
import { config } from '../config/environment';
import { generateSipHa1, encryptSecret, generateSecureToken } from '../utils/crypto';
import { configSynchronizer } from '../telephony/config-synchronizer';
import { eslClient } from '../telephony/esl-client';

const prisma = new PrismaClient();

export async function getExtensions(req: Request, res: Response): Promise<void> {
  try {
    const extensions = await prisma.extension.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, username: true, email: true, firstName: true, lastName: true } },
        voicemailBox: { select: { id: true, mailbox: true, messageCount: true } },
      },
      orderBy: { extensionNumber: 'asc' },
    });

    const liveRegistrations = await eslClient.getRegistrations();
    const regMap = new Map<string, typeof liveRegistrations[0]>();
    for (const r of liveRegistrations) {
      const extNum = r.user.split('@')[0];
      regMap.set(extNum, r);
    }

    const result = extensions.map((ext) => {
      const reg = regMap.get(ext.extensionNumber);
      return {
        id: ext.id,
        extensionNumber: ext.extensionNumber,
        displayName: ext.displayName,
        enabled: ext.enabled,
        callWaiting: ext.callWaiting,
        maxCalls: ext.maxCalls,
        outboundClass: ext.outboundClass,
        dnd: ext.dnd,
        recordCalls: ext.recordCalls,
        department: ext.department,
        user: ext.user,
        voicemailBox: ext.voicemailBox,
        status: reg ? 'ONLINE' : 'OFFLINE',
        registration: reg
          ? {
              contact: reg.contact,
              ip: reg.ip,
              port: reg.port,
              agent: reg.agent,
              status: reg.status,
            }
          : null,
        createdAt: ext.createdAt,
      };
    });

    res.json({ extensions: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve extensions', details: err.message });
  }
}

export async function getExtensionById(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const ext = await prisma.extension.findUnique({
      where: { id },
      include: {
        department: true,
        user: true,
        voicemailBox: true,
      },
    });

    if (!ext) {
      res.status(404).json({ error: 'Extension not found' });
      return;
    }

    const liveRegistrations = await eslClient.getRegistrations();
    const reg = liveRegistrations.find((r) => r.user.startsWith(ext.extensionNumber));

    res.json({
      extension: {
        ...ext,
        sipPasswordHash: undefined,
        sipPasswordEncrypted: undefined,
        status: reg ? 'ONLINE' : 'OFFLINE',
        registration: reg || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve extension', details: err.message });
  }
}

export async function createExtension(req: Request, res: Response): Promise<void> {
  const {
    extensionNumber,
    displayName,
    password,
    departmentId,
    userId,
    outboundClass,
    callWaiting,
    maxCalls,
    recordCalls,
    vmPassword,
  } = req.body;

  if (!extensionNumber || !displayName) {
    res.status(400).json({ error: 'Extension number and display name are required' });
    return;
  }

  const existing = await prisma.extension.findUnique({ where: { extensionNumber } });
  if (existing) {
    res.status(400).json({ error: `Extension number ${extensionNumber} already exists` });
    return;
  }

  const sipPassword = password || `Ext${extensionNumber}_${generateSecureToken(6)}!`;
  const realm = config.asterisk.domain;
  const sipPasswordHash = generateSipHa1(extensionNumber, realm, sipPassword);
  const sipPasswordEncrypted = encryptSecret(sipPassword);

  try {
    const newExt = await prisma.extension.create({
      data: {
        extensionNumber,
        displayName,
        departmentId: departmentId || null,
        userId: userId || null,
        sipPasswordHash,
        sipPasswordEncrypted,
        outboundClass: outboundClass || OutboundClass.LOCAL,
        callWaiting: callWaiting !== undefined ? callWaiting : true,
        maxCalls: maxCalls || 2,
        recordCalls: recordCalls || RecordPolicy.NEVER,
      },
      include: {
        department: true,
        user: true,
      },
    });

    await prisma.voicemailBox.create({
      data: {
        extensionId: newExt.id,
        mailbox: extensionNumber,
        pin: vmPassword || extensionNumber,
      },
    });

    await configSynchronizer.writeExtension({
      extensionNumber,
      displayName,
      password: sipPassword,
      vmPassword: vmPassword || extensionNumber,
      tollAllow: outboundClass ? outboundClass.toLowerCase() : 'local,domestic',
    });

    res.status(201).json({
      extension: {
        id: newExt.id,
        extensionNumber: newExt.extensionNumber,
        displayName: newExt.displayName,
        department: newExt.department,
        user: newExt.user,
        outboundClass: newExt.outboundClass,
      },
      initialCredentials: {
        extensionNumber,
        sipPassword,
        realm,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create extension', details: err.message });
  }
}

export async function updateExtension(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const {
    displayName,
    enabled,
    departmentId,
    userId,
    outboundClass,
    callWaiting,
    maxCalls,
    dnd,
    forwardAlways,
    forwardBusy,
    forwardNoAnswer,
    recordCalls,
  } = req.body;

  try {
    const ext = await prisma.extension.findUnique({ where: { id } });
    if (!ext) {
      res.status(404).json({ error: 'Extension not found' });
      return;
    }

    const updated = await prisma.extension.update({
      where: { id },
      data: {
        displayName: displayName ?? ext.displayName,
        enabled: enabled !== undefined ? enabled : ext.enabled,
        departmentId: departmentId !== undefined ? departmentId : ext.departmentId,
        userId: userId !== undefined ? userId : ext.userId,
        outboundClass: outboundClass ?? ext.outboundClass,
        callWaiting: callWaiting !== undefined ? callWaiting : ext.callWaiting,
        maxCalls: maxCalls ?? ext.maxCalls,
        dnd: dnd !== undefined ? dnd : ext.dnd,
        forwardAlways: forwardAlways !== undefined ? forwardAlways : ext.forwardAlways,
        forwardBusy: forwardBusy !== undefined ? forwardBusy : ext.forwardBusy,
        forwardNoAnswer: forwardNoAnswer !== undefined ? forwardNoAnswer : ext.forwardNoAnswer,
        recordCalls: recordCalls ?? ext.recordCalls,
      },
      include: {
        department: true,
        user: true,
      },
    });

    await configSynchronizer.writeExtension({
      extensionNumber: updated.extensionNumber,
      displayName: updated.displayName,
      password: '$$[default_password]',
      tollAllow: updated.outboundClass.toLowerCase(),
    });

    res.json({ extension: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update extension', details: err.message });
  }
}

export async function deleteExtension(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const ext = await prisma.extension.findUnique({ where: { id } });
    if (!ext) {
      res.status(404).json({ error: 'Extension not found' });
      return;
    }

    await configSynchronizer.removeExtension(ext.extensionNumber);
    await prisma.extension.delete({ where: { id } });

    res.json({ message: `Extension ${ext.extensionNumber} deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete extension', details: err.message });
  }
}

export async function resetCredentials(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const ext = await prisma.extension.findUnique({ where: { id } });
    if (!ext) {
      res.status(404).json({ error: 'Extension not found' });
      return;
    }

    const newPassword = `Ext${ext.extensionNumber}_${generateSecureToken(8)}!`;
    const realm = config.asterisk.domain;
    const sipPasswordHash = generateSipHa1(ext.extensionNumber, realm, newPassword);
    const sipPasswordEncrypted = encryptSecret(newPassword);

    await prisma.extension.update({
      where: { id },
      data: {
        sipPasswordHash,
        sipPasswordEncrypted,
      },
    });

    await configSynchronizer.writeExtension({
      extensionNumber: ext.extensionNumber,
      displayName: ext.displayName,
      password: newPassword,
      tollAllow: ext.outboundClass.toLowerCase(),
    });

    res.json({
      message: `Credentials for Extension ${ext.extensionNumber} reset successfully`,
      credentials: {
        extensionNumber: ext.extensionNumber,
        newPassword,
        realm,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset credentials', details: err.message });
  }
}
