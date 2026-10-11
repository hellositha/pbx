import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '127.0.0.1',
  jwt: {
    secret: process.env.JWT_SECRET || 'eclypetech_pbx_fallback_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  aesSecretKey: process.env.AES_SECRET_KEY || 'eclypetech_aes_256_telephony_secret_key_32bytes',
  asterisk: {
    amiHost: process.env.AST_AMI_HOST || '127.0.0.1',
    amiPort: parseInt(process.env.AST_AMI_PORT || '5038', 10),
    amiUsername: process.env.AST_AMI_USERNAME || 'eclype',
    amiSecret: process.env.AST_AMI_SECRET || 'EclypeAmiSecret123!',
    confDir: process.env.AST_CONF_DIR || '/etc/asterisk',
    recordingsDir: process.env.AST_RECORDINGS_DIR || '/var/spool/asterisk/monitor',
    backupsDir: process.env.AST_BACKUPS_DIR || '/var/backups/eclypetech',
    domain: process.env.AST_DOMAIN || '49.156.43.92',
    sipPort: parseInt(process.env.AST_SIP_PORT || '5060', 10),
    wsPort: parseInt(process.env.AST_WS_PORT || '8088', 10),
    wssPort: parseInt(process.env.AST_WSS_PORT || '8089', 10),
  },
  // Compatibility shim for existing references
  freeswitch: {
    eslHost: '127.0.0.1',
    eslPort: 5038,
    eslPassword: 'EclypeAmiSecret123!',
    confDir: '/etc/asterisk',
    recordingsDir: '/var/spool/asterisk/monitor',
    backupsDir: '/var/backups/pbx',
    domain: process.env.AST_DOMAIN || '49.156.43.92',
    sipPort: 5060,
    wssPort: 8089,
  },
};
