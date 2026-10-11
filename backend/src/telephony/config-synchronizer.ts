import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/environment';
import { amiClient } from './ami-client';

export interface ExtensionXmlData {
  extensionNumber: string;
  displayName: string;
  password: string;
  vmPassword?: string;
  outboundClass?: string;
  tollAllow?: string;
  callgroup?: string;
}

export class ConfigSynchronizer {
  private endpointsConfPath: string;
  private trunksConfPath: string;
  private voicemailConfPath: string;

  constructor() {
    this.endpointsConfPath = path.join(config.asterisk.confDir, 'pjsip.endpoints.conf');
    this.trunksConfPath = path.join(config.asterisk.confDir, 'pjsip.trunks.conf');
    this.voicemailConfPath = path.join(config.asterisk.confDir, 'voicemail.conf');
  }

  /**
   * Generates and writes an Extension PJSIP configuration to Asterisk.
   */
  public async writeExtension(data: ExtensionXmlData): Promise<void> {
    const ext = data.extensionNumber;
    let content = '';

    try {
      content = await fs.readFile(this.endpointsConfPath, 'utf8');
    } catch (e) {
      content = '';
    }

    // Remove existing block for this extension if present
    const regex = new RegExp(`; ---+ \\n; Extension ${ext}[\\s\\S]*?(?=; ---+|$)`, 'g');
    content = content.replace(regex, '');

    const newBlock = `
; ----------------------------------------------------------
; Extension ${ext} (${data.displayName})
; ----------------------------------------------------------
[${ext}](webrtc-endpoint)
auth=${ext}
aors=${ext}
callerid="${data.displayName}" <${ext}>
mailboxes=${ext}@default

[${ext}]
type=auth
auth_type=userpass
username=${ext}
password=${data.password}

[${ext}]
type=aor
max_contacts=5
remove_existing=yes
`;

    content = content.trim() + '\n' + newBlock;
    await fs.writeFile(this.endpointsConfPath, content, 'utf8');

    // Update voicemail.conf
    try {
      let vmContent = await fs.readFile(this.voicemailConfPath, 'utf8');
      const vmLine = `${ext} => ${data.vmPassword || '1234'},${data.displayName},${ext}@eclypetechnology.local`;
      const vmRegex = new RegExp(`^${ext}\\s*=>.*$`, 'm');
      if (vmRegex.test(vmContent)) {
        vmContent = vmContent.replace(vmRegex, vmLine);
      } else {
        vmContent = vmContent.trim() + '\n' + vmLine + '\n';
      }
      await fs.writeFile(this.voicemailConfPath, vmContent, 'utf8');
    } catch (vmErr) {
      // ignore voicemail file write error
    }

    // Trigger Asterisk PJSIP & Dialplan reload
    if (amiClient.isReady()) {
      await amiClient.reloadXml();
    }
  }

  /**
   * Deletes an Extension PJSIP configuration from Asterisk.
   */
  public async removeExtension(extensionNumber: string): Promise<void> {
    try {
      let content = await fs.readFile(this.endpointsConfPath, 'utf8');
      const regex = new RegExp(`; ---+ \\n; Extension ${extensionNumber}[\\s\\S]*?(?=; ---+|$)`, 'g');
      content = content.replace(regex, '');
      await fs.writeFile(this.endpointsConfPath, content, 'utf8');

      // Remove from voicemail.conf
      try {
        let vmContent = await fs.readFile(this.voicemailConfPath, 'utf8');
        const vmRegex = new RegExp(`^${extensionNumber}\\s*=>.*$\\n?`, 'm');
        vmContent = vmContent.replace(vmRegex, '');
        await fs.writeFile(this.voicemailConfPath, vmContent, 'utf8');
      } catch (e) {}

      if (amiClient.isReady()) {
        await amiClient.reloadXml();
      }
    } catch (err) {
      // ignore
    }
  }

  /**
   * Generates and writes SIP Trunk gateway configuration to Asterisk PJSIP trunks.
   */
  public async writeTrunkGateway(trunk: {
    name: string;
    serverAddress: string;
    serverPort: number;
    username?: string;
    password?: string;
    register: boolean;
    callerId?: string;
  }): Promise<void> {
    const safeName = trunk.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    let content = '';

    try {
      content = await fs.readFile(this.trunksConfPath, 'utf8');
    } catch (e) {
      content = '';
    }

    const regex = new RegExp(`; Trunk: ${safeName}[\\s\\S]*?(?=; Trunk:|$)`, 'g');
    content = content.replace(regex, '');

    const newBlock = `
; Trunk: ${safeName}
[${safeName}]
type=endpoint
context=from-pstn
disallow=all
allow=ulaw,alaw,g722
transport=transport-udp
${trunk.username ? `outbound_auth=${safeName}-auth\n` : ''}aors=${safeName}-aor
direct_media=no

[${safeName}-aor]
type=aor
contact=sip:${trunk.serverAddress}:${trunk.serverPort}

${trunk.username ? `[${safeName}-auth]\ntype=auth\nauth_type=userpass\nusername=${trunk.username}\npassword=${trunk.password || ''}\n` : ''}
${trunk.register && trunk.username ? `[${safeName}-reg]\ntype=registration\noutbound_auth=${safeName}-auth\nserver_uri=sip:${trunk.serverAddress}:${trunk.serverPort}\nclient_uri=sip:${trunk.username}@${trunk.serverAddress}:${trunk.serverPort}\n` : ''}
`;

    content = content.trim() + '\n' + newBlock;
    await fs.writeFile(this.trunksConfPath, content, 'utf8');

    if (amiClient.isReady()) {
      await amiClient.reloadXml();
    }
  }

  public async removeTrunkGateway(trunkName: string): Promise<void> {
    const safeName = trunkName.replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      let content = await fs.readFile(this.trunksConfPath, 'utf8');
      const regex = new RegExp(`; Trunk: ${safeName}[\\s\\S]*?(?=; Trunk:|$)`, 'g');
      content = content.replace(regex, '');
      await fs.writeFile(this.trunksConfPath, content, 'utf8');

      if (amiClient.isReady()) {
        await amiClient.reloadXml();
      }
    } catch (err) {
      // ignore
    }
  }
}

export const configSynchronizer = new ConfigSynchronizer();
