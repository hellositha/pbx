import http from 'http';
import { PrismaClient, CallDirection, CallDisposition } from '@prisma/client';
import { app } from './app';
import { config } from './config/environment';
import { eslClient } from './telephony/esl-client';
import { wsHub } from './websocket/ws-server';

const prisma = new PrismaClient();

const server = http.createServer(app);

// 1. Initialize WebSocket Hub
wsHub.initialize(server);

// 2. Ingest FreeSWITCH Hangup events into Call Detail Records (CDR)
eslClient.on('CHANNEL_HANGUP', async (data: Record<string, any>) => {
  try {
    const callUuid = data['Unique-ID'] || data['Channel-Call-UUID'] || '';
    if (!callUuid) return;

    const rawDir = (data['Call-Direction'] || 'internal').toUpperCase();
    let direction: CallDirection = CallDirection.INTERNAL;
    if (rawDir.includes('INBOUND')) direction = CallDirection.INBOUND;
    else if (rawDir.includes('OUTBOUND')) direction = CallDirection.OUTBOUND;

    const callerIdNum = data['Caller-Caller-ID-Number'] || data['Caller-ANI'] || 'Unknown';
    const callerIdName = data['Caller-Caller-ID-Name'] || null;
    const destination = data['Caller-Destination-Number'] || data['variable_dialed_user'] || 'Unknown';
    const hangupCause = data['Hangup-Cause'] || 'NORMAL_CLEARING';

    const duration = parseInt(data['variable_duration'] || '0', 10);
    const billsec = parseInt(data['variable_billsec'] || '0', 10);

    let disposition: CallDisposition = CallDisposition.FAILED;
    if (billsec > 0) {
      disposition = CallDisposition.ANSWERED;
    } else if (hangupCause === 'USER_BUSY') {
      disposition = CallDisposition.BUSY;
    } else if (hangupCause === 'NO_ANSWER') {
      disposition = CallDisposition.NO_ANSWER;
    }

    const startTime = data['Caller-Channel-Created-Time']
      ? new Date(parseInt(data['Caller-Channel-Created-Time'], 10) / 1000)
      : new Date(Date.now() - duration * 1000);

    const answerTime = billsec > 0 && data['Caller-Channel-Answered-Time']
      ? new Date(parseInt(data['Caller-Channel-Answered-Time'], 10) / 1000)
      : null;

    const endTime = data['Caller-Channel-Hangup-Time']
      ? new Date(parseInt(data['Caller-Channel-Hangup-Time'], 10) / 1000)
      : new Date();

    await prisma.callRecord.upsert({
      where: { callUuid },
      update: {
        endTime,
        duration,
        billsec,
        hangupCause,
        disposition,
      },
      create: {
        callUuid,
        direction,
        callerIdNum,
        callerIdName,
        destination,
        sourceExtension: callerIdNum.length <= 4 ? callerIdNum : null,
        destExtension: destination.length <= 4 ? destination : null,
        disposition,
        startTime,
        answerTime,
        endTime,
        duration,
        billsec,
        hangupCause,
      },
    });
  } catch (err) {
    console.error('Failed to ingest CDR from FreeSWITCH event:', err);
  }
});

// 3. Connect to Asterisk Manager Interface (AMI)
eslClient.connect();

eslClient.on('authenticated', () => {
  console.log(`[Telephony] Connected to Asterisk Manager Interface (AMI) at ${config.asterisk.amiHost}:${config.asterisk.amiPort}`);
});

eslClient.on('error', (err) => {
  console.warn('[Telephony] Asterisk AMI Socket notice:', err.message);
});

// 4. Start HTTP & WebSocket Server
server.listen(config.port, config.host, () => {
  console.log(`==========================================================`);
  console.log(`Eclype Tech PBX API Server is LIVE`);
  console.log(`REST API: http://${config.host}:${config.port}/api`);
  console.log(`WebSocket: ws://${config.host}:${config.port}/ws`);
  console.log(`Environment: ${config.env}`);
  console.log(`==========================================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down Eclype Tech PBX API gracefully...');
  setTimeout(() => process.exit(0), 1000).unref();
  try {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
  } catch (e) {}
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  process.exit(0);
});
