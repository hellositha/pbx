import net from 'net';
import { EventEmitter } from 'events';
import { config } from '../config/environment';

export interface ActiveChannel {
  uuid: string;
  direction: 'inbound' | 'outbound';
  created: string;
  name: string;
  state: string;
  cidName: string;
  cidNum: string;
  ipAddr: string;
  dest: string;
  application: string;
  dialplan: string;
  readCodec: string;
  writeCodec: string;
  callstate: string;
  callUuid: string;
}

export interface SofiaRegistration {
  user: string;
  contact: string;
  agent: string;
  status: string;
  host: string;
  ip: string;
  port: number;
  authRealm: string;
}

export class AsteriskAmiClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private connected: boolean = false;
  private authenticated: boolean = false;
  private buffer: string = '';
  private actionIdCounter: number = 1000;
  private pendingActions = new Map<string, { resolve: (res: any) => void; reject: (err: Error) => void }>();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  public connect(): void {
    if (this.socket) {
      this.socket.destroy();
    }

    this.socket = new net.Socket();
    this.socket.setEncoding('utf8');

    this.socket.connect(config.asterisk.amiPort, config.asterisk.amiHost, () => {
      // Connected to AMI port, waiting for greeting
    });

    this.socket.on('data', (data: string) => {
      this.handleData(data);
    });

    this.socket.on('error', (err: Error) => {
      this.connected = false;
      this.authenticated = false;
      this.emit('error', err);
      this.scheduleReconnect();
    });

    this.socket.on('close', () => {
      this.connected = false;
      this.authenticated = false;
      this.emit('disconnected');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private handleData(chunk: string): void {
    this.buffer += chunk;

    // First line greeting from Asterisk (e.g. "Asterisk Call Manager/11.0.0\r\n")
    if (!this.connected && this.buffer.includes('\r\n')) {
      const firstLineEnd = this.buffer.indexOf('\r\n');
      const greeting = this.buffer.substring(0, firstLineEnd);
      if (greeting.startsWith('Asterisk Call Manager')) {
        this.connected = true;
        this.buffer = this.buffer.substring(firstLineEnd + 2);
        this.login();
      }
    }

    // Process complete AMI message blocks separated by \r\n\r\n or \n\n
    while (true) {
      let delimIndex = this.buffer.indexOf('\r\n\r\n');
      let delimLength = 4;
      if (delimIndex === -1) {
        delimIndex = this.buffer.indexOf('\n\n');
        delimLength = 2;
      }
      if (delimIndex === -1) break;

      const rawBlock = this.buffer.substring(0, delimIndex);
      this.buffer = this.buffer.substring(delimIndex + delimLength);

      this.processBlock(rawBlock);
    }
  }

  private parseBlock(raw: string): { headers: Record<string, string>; output: string[] } {
    const headers: Record<string, string> = {};
    const output: string[] = [];
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      if (line.startsWith('Output:')) {
        output.push(line.substring(7).trim());
        continue;
      }
      const colon = line.indexOf(':');
      if (colon !== -1) {
        const key = line.substring(0, colon).trim().toLowerCase();
        const val = line.substring(colon + 1).trim();
        headers[key] = val;
      }
    }
    return { headers, output };
  }

  private processBlock(raw: string): void {
    const { headers, output } = this.parseBlock(raw);

    // 1. Check if this is a response to an action
    const actionId = headers['actionid'];
    if (actionId && this.pendingActions.has(actionId)) {
      const handler = this.pendingActions.get(actionId)!;
      this.pendingActions.delete(actionId);

      const responseStatus = headers['response'] || 'Success';
      if (responseStatus.toLowerCase() === 'error') {
        handler.reject(new Error(headers['message'] || 'AMI Action failed'));
      } else {
        handler.resolve({ headers, output, raw });
      }
      return;
    }

    // 2. Check if this is an Event
    const eventName = headers['event'];
    if (eventName) {
      this.handleEvent(eventName, headers);
    }
  }

  private login(): void {
    const loginActionId = 'auth-' + Date.now();
    this.sendAction({
      Action: 'Login',
      Username: config.asterisk.amiUsername,
      Secret: config.asterisk.amiSecret,
      ActionID: loginActionId,
    })
      .then(() => {
        this.authenticated = true;
        this.emit('authenticated');
      })
      .catch((err) => {
        this.authenticated = false;
        this.emit('error', new Error(`AMI authentication rejected: ${err.message}`));
      });
  }

  public sendAction(fields: Record<string, string>): Promise<{ headers: Record<string, string>; output: string[]; raw: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        return reject(new Error('Asterisk AMI socket is not connected'));
      }

      const actionId = fields.ActionID || `act-${++this.actionIdCounter}`;
      fields.ActionID = actionId;

      this.pendingActions.set(actionId, { resolve, reject });

      let payload = '';
      for (const [k, v] of Object.entries(fields)) {
        payload += `${k}: ${v}\r\n`;
      }
      payload += '\r\n';

      this.socket.write(payload, 'utf8');

      // 10s action timeout
      setTimeout(() => {
        if (this.pendingActions.has(actionId)) {
          this.pendingActions.delete(actionId);
          reject(new Error(`AMI Action ${fields.Action} timed out`));
        }
      }, 10000);
    });
  }

  private handleEvent(eventName: string, headers: Record<string, string>): void {
    this.emit('event', headers);
    this.emit(eventName, headers);

    // Map Asterisk events to standard PBX WebSocket notifications
    switch (eventName.toLowerCase()) {
      case 'newchannel':
        this.emit('CHANNEL_CREATE', {
          'Event-Name': 'CHANNEL_CREATE',
          'Unique-ID': headers['uniqueid'] || headers['channel'],
          'Channel-Name': headers['channel'],
          'Caller-Caller-ID-Number': headers['calleridnum'] || 'Anonymous',
          'Caller-Caller-ID-Name': headers['calleridname'] || 'Anonymous',
          'Caller-Destination-Number': headers['exten'] || 's',
          'Channel-Call-State': 'ACTIVE',
        });
        break;

      case 'newstate':
        if ((headers['channelstatedesc'] || '').toLowerCase() === 'up') {
          this.emit('CHANNEL_ANSWER', {
            'Event-Name': 'CHANNEL_ANSWER',
            'Unique-ID': headers['uniqueid'] || headers['channel'],
            'Channel-Name': headers['channel'],
            'Caller-Caller-ID-Number': headers['calleridnum'],
            'Caller-Destination-Number': headers['exten'],
          });
        }
        break;

      case 'hangup':
        this.emit('CHANNEL_HANGUP', {
          'Event-Name': 'CHANNEL_HANGUP',
          'Unique-ID': headers['uniqueid'] || headers['channel'],
          'Channel-Name': headers['channel'],
          'Hangup-Cause': headers['cause-txt'] || 'NORMAL_CLEARING',
        });
        break;

      case 'bridgeenter':
      case 'bridgecreate':
        this.emit('CHANNEL_BRIDGE', {
          'Event-Name': 'CHANNEL_BRIDGE',
          'Bridge-Unique-ID': headers['bridgeuniqueid'] || headers['uniqueid'],
          'Channel-Name': headers['channel'],
        });
        break;

      case 'contactstatus':
        if (headers['contactstatus'] === 'Reachable') {
          this.emit('sofia::register', {
            profile: 'internal',
            from_user: headers['aor'],
            contact: headers['uri'],
          });
        } else if (headers['contactstatus'] === 'Removed' || headers['contactstatus'] === 'Unreachable') {
          this.emit('sofia::unregister', {
            profile: 'internal',
            from_user: headers['aor'],
          });
        }
        break;
    }
  }

  public isReady(): boolean {
    return this.connected && this.authenticated;
  }

  // --- High-Level PBX Telephony API (Asterisk Implementation) ---

  public async api(commandString: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Asterisk AMI not connected or authenticated');
    }
    const res = await this.sendAction({
      Action: 'Command',
      Command: commandString,
    });
    if (res.output && res.output.length > 0) {
      return res.output.join('\n');
    }
    return res.headers['message'] || '+OK';
  }

  public async getActiveChannels(): Promise<ActiveChannel[]> {
    try {
      const raw = await this.api('core show channels concise');
      const lines = raw.split('\n').filter((l) => l.trim().length > 0 && l.includes('!'));
      return lines.map((line) => {
        const parts = line.split('!');
        const channel = parts[0] || '';
        const context = parts[1] || 'from-internal';
        const exten = parts[2] || '';
        const state = parts[4] || 'Up';
        const app = parts[5] || '';
        const cid = parts[7] || '';
        const duration = parts[10] || '0';
        const uniqueid = parts[12] || channel;

        return {
          uuid: uniqueid,
          direction: 'inbound',
          created: new Date().toISOString(),
          name: channel,
          state: state,
          cidName: cid || 'Caller',
          cidNum: cid || 'Anonymous',
          ipAddr: '127.0.0.1',
          dest: exten || app || 'In-Call',
          application: app,
          dialplan: context,
          readCodec: 'opus',
          writeCodec: 'opus',
          callstate: state.toUpperCase() === 'UP' ? 'ACTIVE' : state.toUpperCase(),
          callUuid: uniqueid,
        };
      });
    } catch (err) {
      return [];
    }
  }

  public async getRegistrations(): Promise<SofiaRegistration[]> {
    try {
      const raw = await this.api('pjsip show endpoints');
      const lines = raw.split('\n');
      const regs: SofiaRegistration[] = [];

      for (const line of lines) {
        const match = line.match(/Endpoint:\s+([a-zA-Z0-9_-]+)\/.*?(Not in use|In use|Busy|Unavailable|Ringing)/i);
        if (match) {
          const user = match[1];
          const state = match[2];
          const isOnline = state !== 'Unavailable';

          regs.push({
            user,
            contact: `sip:${user}@${config.asterisk.domain}`,
            agent: 'Asterisk PJSIP',
            status: isOnline ? 'ONLINE' : 'OFFLINE',
            host: config.asterisk.domain,
            ip: config.asterisk.domain,
            port: config.asterisk.sipPort,
            authRealm: 'eclype-pbx.local',
          });
        }
      }
      return regs;
    } catch (err) {
      return [];
    }
  }

  public async hangupCall(channelOrUuid: string, cause: string = '16'): Promise<string> {
    try {
      await this.sendAction({
        Action: 'Hangup',
        Channel: channelOrUuid,
        Cause: cause,
      });
      return '+OK Hangup initiated';
    } catch (e: any) {
      return this.api(`channel request hangup ${channelOrUuid}`);
    }
  }

  public async holdCall(channelOrUuid: string): Promise<string> {
    // Asterisk soft hold via MusicOnHold toggle or park
    return this.api(`channel redirect ${channelOrUuid} from-internal,*43,1`);
  }

  public async transferCall(channelOrUuid: string, destination: string, context: string = 'from-internal'): Promise<string> {
    try {
      await this.sendAction({
        Action: 'Redirect',
        Channel: channelOrUuid,
        Exten: destination,
        Context: context,
        Priority: '1',
      });
      return `+OK Transferred to ${destination}`;
    } catch (err: any) {
      return this.api(`channel redirect ${channelOrUuid} ${context},${destination},1`);
    }
  }

  public async originate(destination: string, application: string = 'Echo'): Promise<string> {
    try {
      // Determine if destination is an extension or channel
      const channel = destination.startsWith('PJSIP/') ? destination : `PJSIP/${destination}`;
      await this.sendAction({
        Action: 'Originate',
        Channel: channel,
        Application: application.replace('&', ''),
        Data: '',
        CallerID: 'Eclype PBX <1000>',
        Timeout: '30000',
      });
      return '+OK Originate dispatched';
    } catch (err: any) {
      return this.api(`channel originate PJSIP/${destination} application ${application.replace('&', '')}`);
    }
  }

  public async eavesdrop(targetChannel: string, supervisorExt: string, mode: string = 'SPY'): Promise<string> {
    // Asterisk ChanSpy application:
    // Options: 'q' (quiet), 'w' (whisper/agent hear only), 'B' (barge in both hear)
    const spyOption = mode === 'BARGE' ? 'B' : mode === 'WHISPER' ? 'w' : 'q';
    return this.sendAction({
      Action: 'Originate',
      Channel: `PJSIP/${supervisorExt}`,
      Application: 'ChanSpy',
      Data: `${targetChannel},${spyOption}`,
      CallerID: `Supervisor Spy <${supervisorExt}>`,
    }).then(() => '+OK Eavesdrop dispatched');
  }

  public async reloadXml(): Promise<string> {
    // In Asterisk, reload PJSIP and Dialplan
    await this.api('pjsip reload');
    await this.api('dialplan reload');
    return '+OK [Asterisk PJSIP & Dialplan Reloaded]';
  }

  public async sofiaProfileRescan(_profile: string = 'internal'): Promise<string> {
    return this.api('pjsip reload');
  }
}

export const amiClient = new AsteriskAmiClient();
// Compatibility alias for existing ESL references
export const eslClient = amiClient;
