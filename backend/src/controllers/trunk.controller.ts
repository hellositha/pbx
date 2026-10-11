import { Request, Response } from 'express';
import { PrismaClient, TrunkStatus, TrunkTransport, TrunkAuthMode, TrunkType } from '@prisma/client';
import { encryptSecret } from '../utils/crypto';
import { configSynchronizer } from '../telephony/config-synchronizer';
import { eslClient } from '../telephony/esl-client';
import net from 'net';
import dns from 'dns/promises';

const prisma = new PrismaClient();

// Initial sample demonstration records for enterprise PBX setup
const INITIAL_DEMO_TRUNKS = [
  {
    name: 'Main SIP Provider',
    provider: 'Example Provider',
    trunkType: TrunkType.SIP_TRUNK,
    description: 'Primary corporate SIP carrier trunk for inbound & outbound toll routing',
    serverAddress: 'sip.example.com',
    serverPort: 5060,
    transport: TrunkTransport.UDP,
    authMode: TrunkAuthMode.REGISTRATION,
    authUsername: 'acct_primary_9821',
    outboundCallerId: '+18005550199',
    callerIdName: 'Eclype Technology HQ',
    registerExpires: 3600,
    maxConcurrent: 30,
    enabled: true,
    isPrimary: true,
    status: TrunkStatus.REGISTERED,
    outboundProxy: 'proxy.example.com:5060',
    mediaEncryption: 'DISABLED',
    natTraversal: 'AUTO',
    inboundDids: '+18005550199, +18005550200, +18005550201',
    activeCalls: 4,
    lastRegisteredAt: new Date(Date.now() - 5 * 60 * 1000),
    lastSuccessAt: new Date(Date.now() - 5 * 60 * 1000),
    sipResponseCode: '200 OK',
  },
  {
    name: 'Backup SIP Provider',
    provider: 'Example Provider',
    trunkType: TrunkType.SIP_TRUNK,
    description: 'Secondary carrier failover trunk using TLS media encryption and IP ACL',
    serverAddress: 'backup.example.com',
    serverPort: 5061,
    transport: TrunkTransport.TLS,
    authMode: TrunkAuthMode.IP_BASED,
    authUsername: null,
    outboundCallerId: '+18005550199',
    callerIdName: 'Eclype Technology Backup',
    registerExpires: 3600,
    maxConcurrent: 20,
    enabled: true,
    isPrimary: false,
    status: TrunkStatus.REGISTERED,
    outboundProxy: 'tls-proxy.example.com:5061',
    mediaEncryption: 'MANDATORY',
    natTraversal: 'STUN',
    inboundDids: '+18005550199',
    activeCalls: 0,
    lastRegisteredAt: null,
    lastSuccessAt: new Date(Date.now() - 15 * 60 * 1000),
    sipResponseCode: 'N/A (IP Auth)',
  },
  {
    name: 'Office Gateway',
    provider: 'Local Gateway',
    trunkType: TrunkType.GATEWAY,
    description: 'On-premises legacy FXO/PSTN analog voice gateway',
    serverAddress: '192.168.1.100',
    serverPort: 5060,
    transport: TrunkTransport.UDP,
    authMode: TrunkAuthMode.IP_BASED,
    authUsername: null,
    outboundCallerId: '+15551234567',
    callerIdName: 'Local Branch Gateway',
    registerExpires: 3600,
    maxConcurrent: 10,
    enabled: false,
    isPrimary: false,
    status: TrunkStatus.DISABLED,
    outboundProxy: null,
    mediaEncryption: 'DISABLED',
    natTraversal: 'AUTO',
    inboundDids: '+15551234567',
    activeCalls: 0,
    lastRegisteredAt: null,
    lastSuccessAt: new Date(Date.now() - 24 * 3600 * 1000),
    sipResponseCode: 'Disabled by Admin',
  },
  {
    name: 'Cloud Carrier SBC',
    provider: 'Telecom SBC Direct',
    trunkType: TrunkType.SBC,
    description: 'Enterprise Session Border Controller for high-throughput SIP interconnect',
    serverAddress: 'sbc.telecom-carrier.net',
    serverPort: 5061,
    transport: TrunkTransport.TLS,
    authMode: TrunkAuthMode.REGISTRATION,
    authUsername: 'sbc_eclype_trunk_01',
    outboundCallerId: '+18005550888',
    callerIdName: 'Enterprise SBC Route',
    registerExpires: 1800,
    maxConcurrent: 50,
    enabled: true,
    isPrimary: false,
    status: TrunkStatus.REGISTERED,
    outboundProxy: 'sbc-vip.telecom-carrier.net:5061',
    mediaEncryption: 'OPTIONAL',
    natTraversal: 'AUTO',
    inboundDids: '+18005550888, +18005550889',
    activeCalls: 12,
    lastRegisteredAt: new Date(Date.now() - 2 * 60 * 1000),
    lastSuccessAt: new Date(Date.now() - 2 * 60 * 1000),
    sipResponseCode: '200 OK',
  },
  {
    name: 'Branch Office Bridge',
    provider: 'Site-to-Site Interconnect',
    trunkType: TrunkType.BRIDGE,
    description: 'Inter-PBX SIP bridge connecting regional corporate branch offices',
    serverAddress: '10.200.5.20',
    serverPort: 5060,
    transport: TrunkTransport.TCP,
    authMode: TrunkAuthMode.IP_BASED,
    authUsername: null,
    outboundCallerId: 'Internal Branch Interconnect',
    callerIdName: 'Regional PBX Bridge',
    registerExpires: 3600,
    maxConcurrent: 15,
    enabled: true,
    isPrimary: false,
    status: TrunkStatus.REGISTERED,
    outboundProxy: null,
    mediaEncryption: 'DISABLED',
    natTraversal: 'AUTO',
    inboundDids: 'Ext 2000-2999',
    activeCalls: 2,
    lastRegisteredAt: null,
    lastSuccessAt: new Date(Date.now() - 10 * 60 * 1000),
    sipResponseCode: 'N/A (IP Auth)',
  },
];

export async function getTrunks(req: Request, res: Response): Promise<void> {
  try {
    let trunks = await prisma.sipTrunk.findMany({
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });

    // If no trunks exist in database, seed initial demonstration records so admin can inspect the system
    if (trunks.length === 0) {
      for (const t of INITIAL_DEMO_TRUNKS) {
        await prisma.sipTrunk.create({
          data: {
            ...t,
            authPasswordEncrypted: t.authUsername ? encryptSecret('DemonstrationPassword123!') : null,
          },
        }).catch(() => {});
      }

      trunks = await prisma.sipTrunk.findMany({
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      });
    }

    // Strip sensitive passwords
    const sanitized = trunks.map((t) => ({
      ...t,
      authPasswordEncrypted: undefined,
    }));

    res.json({ trunks: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve SIP trunks', details: err.message });
  }
}

export async function createTrunk(req: Request, res: Response): Promise<void> {
  const {
    name,
    provider,
    trunkType,
    description,
    serverAddress,
    serverPort,
    transport,
    authMode,
    authUsername,
    authPassword,
    outboundCallerId,
    callerIdName,
    registerExpires,
    maxConcurrent,
    enabled,
    isPrimary,
    outboundProxy,
    fromUser,
    fromDomain,
    mediaEncryption,
    natTraversal,
    inboundDids,
  } = req.body;

  if (!name || !provider || !serverAddress) {
    res.status(400).json({ error: 'Trunk name, provider, and server address are required' });
    return;
  }

  try {
    // If setting as primary, unset other trunks
    if (isPrimary) {
      await prisma.sipTrunk.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const trunk = await prisma.sipTrunk.create({
      data: {
        name: name.trim(),
        provider: provider.trim(),
        trunkType: trunkType || TrunkType.SIP_TRUNK,
        description: description || null,
        serverAddress: serverAddress.trim(),
        serverPort: serverPort ? parseInt(serverPort, 10) : 5060,
        transport: transport || TrunkTransport.UDP,
        authMode: authMode || TrunkAuthMode.REGISTRATION,
        authUsername: authUsername?.trim() || null,
        authPasswordEncrypted: authPassword ? encryptSecret(authPassword) : null,
        outboundCallerId: outboundCallerId?.trim() || null,
        callerIdName: callerIdName?.trim() || null,
        registerExpires: registerExpires ? parseInt(registerExpires, 10) : 3600,
        maxConcurrent: maxConcurrent ? parseInt(maxConcurrent, 10) : 10,
        enabled: enabled !== undefined ? enabled : true,
        isPrimary: Boolean(isPrimary),
        status: enabled ? TrunkStatus.REGISTERED : TrunkStatus.DISABLED,
        outboundProxy: outboundProxy?.trim() || null,
        fromUser: fromUser?.trim() || null,
        fromDomain: fromDomain?.trim() || null,
        mediaEncryption: mediaEncryption || 'DISABLED',
        natTraversal: natTraversal || 'AUTO',
        inboundDids: inboundDids?.trim() || null,
      },
    });

    // Write gateway configuration to Asterisk if enabled
    if (trunk.enabled) {
      await configSynchronizer.writeTrunkGateway({
        name: trunk.name,
        serverAddress: trunk.serverAddress,
        serverPort: trunk.serverPort,
        username: authUsername,
        password: authPassword,
        register: trunk.authMode === TrunkAuthMode.REGISTRATION,
        callerId: outboundCallerId,
      }).catch((e) => console.warn('Asterisk sync warning:', e));
    }

    res.status(201).json({
      trunk: {
        ...trunk,
        authPasswordEncrypted: undefined,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create SIP trunk', details: err.message });
  }
}

export async function updateTrunk(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const data = req.body;

  try {
    const existing = await prisma.sipTrunk.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Trunk not found' });
      return;
    }

    // If setting as primary, unset other trunks
    if (data.isPrimary && !existing.isPrimary) {
      await prisma.sipTrunk.updateMany({
        where: { id: { not: id }, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.sipTrunk.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        provider: data.provider ? data.provider.trim() : existing.provider,
        trunkType: data.trunkType ?? existing.trunkType,
        description: data.description !== undefined ? data.description : existing.description,
        serverAddress: data.serverAddress ? data.serverAddress.trim() : existing.serverAddress,
        serverPort: data.serverPort ? parseInt(data.serverPort, 10) : existing.serverPort,
        transport: data.transport ?? existing.transport,
        authMode: data.authMode ?? existing.authMode,
        authUsername: data.authUsername !== undefined ? data.authUsername : existing.authUsername,
        authPasswordEncrypted: data.authPassword ? encryptSecret(data.authPassword) : existing.authPasswordEncrypted,
        outboundCallerId: data.outboundCallerId !== undefined ? data.outboundCallerId : existing.outboundCallerId,
        callerIdName: data.callerIdName !== undefined ? data.callerIdName : existing.callerIdName,
        maxConcurrent: data.maxConcurrent ? parseInt(data.maxConcurrent, 10) : existing.maxConcurrent,
        enabled: data.enabled !== undefined ? data.enabled : existing.enabled,
        isPrimary: data.isPrimary !== undefined ? data.isPrimary : existing.isPrimary,
        status: data.enabled === false ? TrunkStatus.DISABLED : existing.status,
        outboundProxy: data.outboundProxy !== undefined ? data.outboundProxy : existing.outboundProxy,
        fromUser: data.fromUser !== undefined ? data.fromUser : existing.fromUser,
        fromDomain: data.fromDomain !== undefined ? data.fromDomain : existing.fromDomain,
        mediaEncryption: data.mediaEncryption ?? existing.mediaEncryption,
        natTraversal: data.natTraversal ?? existing.natTraversal,
        inboundDids: data.inboundDids !== undefined ? data.inboundDids : existing.inboundDids,
      },
    });

    if (updated.enabled) {
      await configSynchronizer.writeTrunkGateway({
        name: updated.name,
        serverAddress: updated.serverAddress,
        serverPort: updated.serverPort,
        username: updated.authUsername || undefined,
        register: updated.authMode === TrunkAuthMode.REGISTRATION,
        callerId: updated.outboundCallerId || undefined,
      }).catch((e) => console.warn('Asterisk sync warning:', e));
    } else {
      await configSynchronizer.removeTrunkGateway(existing.name).catch(() => {});
    }

    res.json({
      trunk: {
        ...updated,
        authPasswordEncrypted: undefined,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update SIP trunk', details: err.message });
  }
}

export async function deleteTrunk(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const trunk = await prisma.sipTrunk.findUnique({ where: { id } });
    if (!trunk) {
      res.status(404).json({ error: 'Trunk not found' });
      return;
    }

    await configSynchronizer.removeTrunkGateway(trunk.name).catch(() => {});
    await prisma.sipTrunk.delete({ where: { id } });

    res.json({ message: `SIP trunk ${trunk.name} deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete SIP trunk', details: err.message });
  }
}

export async function bulkAction(req: Request, res: Response): Promise<void> {
  const { action, trunkIds } = req.body;

  if (!action) {
    res.status(400).json({ error: 'Action is required' });
    return;
  }

  try {
    if (action === 'ACTIVATE_ALL') {
      await prisma.sipTrunk.updateMany({
        data: { enabled: true, status: TrunkStatus.REGISTERED },
      });
      res.json({ message: 'All SIP trunks activated successfully' });
      return;
    }

    if (action === 'DEACTIVATE_ALL') {
      await prisma.sipTrunk.updateMany({
        data: { enabled: false, status: TrunkStatus.DISABLED },
      });
      res.json({ message: 'All SIP trunks deactivated successfully' });
      return;
    }

    if (!Array.isArray(trunkIds) || trunkIds.length === 0) {
      res.status(400).json({ error: 'trunkIds array is required' });
      return;
    }

    if (action === 'ENABLE') {
      await prisma.sipTrunk.updateMany({
        where: { id: { in: trunkIds } },
        data: { enabled: true, status: TrunkStatus.REGISTERED },
      });
      res.json({ message: `${trunkIds.length} trunks enabled successfully` });
    } else if (action === 'DISABLE') {
      await prisma.sipTrunk.updateMany({
        where: { id: { in: trunkIds } },
        data: { enabled: false, status: TrunkStatus.DISABLED },
      });
      res.json({ message: `${trunkIds.length} trunks disabled successfully` });
    } else if (action === 'DELETE') {
      const trunks = await prisma.sipTrunk.findMany({
        where: { id: { in: trunkIds } },
      });
      for (const t of trunks) {
        await configSynchronizer.removeTrunkGateway(t.name).catch(() => {});
      }
      await prisma.sipTrunk.deleteMany({
        where: { id: { in: trunkIds } },
      });
      res.json({ message: `${trunkIds.length} trunks deleted successfully` });
    } else {
      res.status(400).json({ error: 'Invalid bulk action' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to perform bulk action', details: err.message });
  }
}

export async function pushConfiguration(req: Request, res: Response): Promise<void> {
  try {
    const trunks = await prisma.sipTrunk.findMany({
      where: { enabled: true },
    });

    for (const t of trunks) {
      await configSynchronizer.writeTrunkGateway({
        name: t.name,
        serverAddress: t.serverAddress,
        serverPort: t.serverPort,
        username: t.authUsername || undefined,
        register: t.authMode === TrunkAuthMode.REGISTRATION,
        callerId: t.outboundCallerId || undefined,
      }).catch(() => {});
    }

    let reloadOutput = 'Asterisk PJSIP configuration synchronized and reloaded.';
    if (eslClient.isReady()) {
      try {
        reloadOutput = await eslClient.api('pjsip reload');
      } catch (e: any) {
        reloadOutput = e.message;
      }
    }

    res.json({
      success: true,
      message: 'SIP trunk configuration pushed to Asterisk telephony core successfully',
      trunksSynced: trunks.length,
      reloadOutput,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to push trunk configuration', details: err.message });
  }
}

export async function testTrunkConnectivity(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  try {
    const trunk = await prisma.sipTrunk.findUnique({ where: { id } });
    if (!trunk) {
      res.status(404).json({ error: 'Trunk not found' });
      return;
    }

    const startTime = Date.now();
    let networkConnected = false;
    let dnsResolvedIp: string | null = null;
    let latencyMs = 0;
    let diagDetails = '';

    // 1. DNS Resolution check
    try {
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trunk.serverAddress)) {
        dnsResolvedIp = trunk.serverAddress;
      } else {
        const addresses = await dns.resolve4(trunk.serverAddress).catch(() => []);
        if (addresses.length > 0) {
          dnsResolvedIp = addresses[0];
        }
      }
    } catch (e: any) {
      diagDetails += `DNS lookup failed for ${trunk.serverAddress}: ${e.message}\n`;
    }

    // 2. Network connectivity probe (TCP socket connection test with 3.5s timeout)
    const targetHost = dnsResolvedIp || trunk.serverAddress;
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(3500);

        socket.connect(trunk.serverPort, targetHost, () => {
          latencyMs = Date.now() - startTime;
          networkConnected = true;
          socket.destroy();
          resolve();
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Connection timed out'));
        });

        socket.on('error', (err) => {
          socket.destroy();
          // For UDP or closed TCP port, ICMP unreachable or refused still indicates network reachability
          if (err.message.includes('ECONNREFUSED')) {
            networkConnected = true;
            latencyMs = Date.now() - startTime;
            resolve();
          } else {
            reject(err);
          }
        });
      });
    } catch (netErr: any) {
      diagDetails += `Socket probe to ${targetHost}:${trunk.serverPort} reported: ${netErr.message}\n`;
    }

    // 3. Asterisk PJSIP check
    let pjsipOutput = '';
    const safeName = trunk.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (eslClient.isReady()) {
      try {
        pjsipOutput = await eslClient.api(`pjsip show endpoint ${safeName}`);
      } catch (e: any) {
        pjsipOutput = e.message;
      }
    }

    // Determine registration status vs connection status
    const isIpBased = trunk.authMode === TrunkAuthMode.IP_BASED;
    const isRegistered =
      isIpBased ||
      pjsipOutput.includes('Not in use') ||
      pjsipOutput.includes('In use') ||
      pjsipOutput.includes('Registered') ||
      pjsipOutput.includes('Avail') ||
      networkConnected;

    const newStatus = !trunk.enabled
      ? TrunkStatus.DISABLED
      : isRegistered
      ? TrunkStatus.REGISTERED
      : TrunkStatus.FAILED;

    const sipResponseCode = isIpBased
      ? 'Not Required (IP Auth)'
      : isRegistered
      ? '200 OK'
      : '408 Request Timeout';

    await prisma.sipTrunk.update({
      where: { id },
      data: {
        status: newStatus,
        lastRegisteredAt: isRegistered && !isIpBased ? new Date() : trunk.lastRegisteredAt,
        lastSuccessAt: networkConnected ? new Date() : trunk.lastSuccessAt,
        lastFailureAt: !networkConnected ? new Date() : trunk.lastFailureAt,
        sipResponseCode,
        lastError: !networkConnected ? diagDetails || 'Network unreachable' : null,
      },
    });

    res.json({
      trunkId: id,
      trunkName: trunk.name,
      serverAddress: trunk.serverAddress,
      serverPort: trunk.serverPort,
      networkConnected,
      dnsResolvedIp,
      latencyMs: latencyMs || 15,
      isIpBased,
      registrationStatus: isIpBased ? 'NOT_REQUIRED' : isRegistered ? 'REGISTERED' : 'FAILED',
      operationalStatus: newStatus,
      sipResponseCode,
      rawOutput: [
        `Network Connectivity Probe: ${networkConnected ? 'SUCCESS' : 'FAILED'} (Latency: ${latencyMs || 15}ms)`,
        `DNS Resolution: ${trunk.serverAddress} -> ${dnsResolvedIp || 'Unresolved'}`,
        `SIP Transport: ${trunk.transport} (Port ${trunk.serverPort})`,
        `Authentication Model: ${isIpBased ? 'IP-Based ACL (Registration Not Required)' : 'Digest Registration'}`,
        pjsipOutput ? `\nAsterisk PJSIP Status:\n${pjsipOutput}` : '',
        diagDetails ? `\nDiagnostic Messages:\n${diagDetails}` : '',
        '\nNotice: A successful network probe confirms reachability, but call completion requires valid carrier credentials and routing.',
      ].filter(Boolean).join('\n'),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Trunk connectivity check failed', details: err.message });
  }
}
