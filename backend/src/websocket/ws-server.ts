import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { eslClient } from '../telephony/esl-client';
import { getSystemMetrics } from '../utils/system-stats';

export interface WsMessage {
  type: string;
  payload: any;
  timestamp: string;
}

class PbxWebSocketHub {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private metricsInterval: NodeJS.Timeout | null = null;

  public initialize(server: http.Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      // Optional authentication check via URL query token: ?token=xyz
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (token) {
        try {
          jwt.verify(token, config.jwt.secret);
        } catch (err) {
          ws.close(4001, 'Unauthorized');
          return;
        }
      }

      this.clients.add(ws);

      // Send initial welcome & system state
      this.sendToClient(ws, 'CONNECTED', {
        server: 'Eclype Tech PBX Realtime Hub',
        version: '1.0.0',
        eslConnected: eslClient.isReady(),
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    // Wire up ESL events to WebSocket broadcasts
    this.wireEslEvents();

    // Broadcast system metrics every 5 seconds to active dashboards
    this.metricsInterval = setInterval(async () => {
      if (this.clients.size > 0) {
        try {
          const metrics = await getSystemMetrics();
          const channels = await eslClient.getActiveChannels();
          const registrations = await eslClient.getRegistrations();
          this.broadcast('SYSTEM_TELEMETRY', {
            metrics,
            activeCallsCount: channels.length,
            registeredExtensionsCount: registrations.length,
          });
        } catch (err) {
          // ignore
        }
      }
    }, 5000);
  }

  private wireEslEvents(): void {
    eslClient.on('CHANNEL_CREATE', (data) => {
      this.broadcast('CALL_CREATE', {
        uuid: data['Unique-ID'] || data['Channel-Call-UUID'],
        direction: data['Call-Direction'] || 'inbound',
        callerId: data['Caller-Caller-ID-Number'] || '',
        destination: data['Caller-Destination-Number'] || '',
        channel: data['Channel-Name'] || '',
      });
    });

    eslClient.on('CHANNEL_ANSWER', (data) => {
      this.broadcast('CALL_ANSWER', {
        uuid: data['Unique-ID'] || data['Channel-Call-UUID'],
        callerId: data['Caller-Caller-ID-Number'] || '',
        destination: data['Caller-Destination-Number'] || '',
        state: 'ACTIVE',
      });
    });

    eslClient.on('CHANNEL_HANGUP', (data) => {
      this.broadcast('CALL_HANGUP', {
        uuid: data['Unique-ID'] || data['Channel-Call-UUID'],
        cause: data['Hangup-Cause'] || 'NORMAL_CLEARING',
        duration: data['variable_duration'] || 0,
        billsec: data['variable_billsec'] || 0,
      });
    });

    eslClient.on('CUSTOM', (data) => {
      const subclass = data['Event-Subclass'];
      if (subclass === 'sofia::register' || subclass === 'sofia::unregister') {
        this.broadcast('EXTENSION_PRESENCE', {
          user: data['from-user'] || '',
          contact: data['contact'] || '',
          event: subclass === 'sofia::register' ? 'REGISTERED' : 'UNREGISTERED',
          networkIp: data['network-ip'] || '',
          networkPort: data['network-port'] || '',
        });
      }
    });
  }

  public broadcast(type: string, payload: any): void {
    const message: WsMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    const serialized = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  private sendToClient(ws: WebSocket, type: string, payload: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
    }
  }
}

export const wsHub = new PbxWebSocketHub();
