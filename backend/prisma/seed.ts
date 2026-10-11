import { PrismaClient, Role, OutboundClass, RecordPolicy, TrunkTransport, TrunkAuthMode, TrunkStatus, DestinationType, RingStrategy, QueueStrategy, AgentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to encrypt SIP password for provisioning storage (AES-256-CBC)
function encryptPassword(text: string, secretKey: string = 'eclypetech_aes_256_telephony_secret_key_32bytes'): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Generate SIP MD5 HA1 hash: md5(username:realm:password)
function generateSipHa1(username: string, realm: string, pass: string): string {
  return crypto.createHash('md5').update(`${username}:${realm}:${pass}`).digest('hex');
}

async function main() {
  console.log('Seeding Eclype Technology PBX database...');

  // 1. Create Departments
  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'IT & Infrastructure',
      code: 'IT',
      description: 'System administration, telephony engineering, and IT operations',
    },
  });

  const deptSales = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: {
      name: 'Sales & Business Development',
      code: 'SALES',
      description: 'Enterprise account executives and sales development representatives',
    },
  });

  const deptSupport = await prisma.department.upsert({
    where: { code: 'SUPPORT' },
    update: {},
    create: {
      name: 'Customer Support',
      code: 'SUPPORT',
      description: 'Tier 1 & Tier 2 customer service and technical support queue',
    },
  });

  const deptManagement = await prisma.department.upsert({
    where: { code: 'MGMT' },
    update: {},
    create: {
      name: 'Executive Management',
      code: 'MGMT',
      description: 'Executive officers and department heads',
    },
  });

  console.log('Departments seeded.');

  // 2. Create Users
  const superAdminPassword = await bcrypt.hash('Admin@EclypeTech2026!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: superAdminPassword },
    create: {
      username: 'admin',
      email: 'admin@eclypetechnology.com',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Administrator',
      role: Role.SUPER_ADMIN,
      departmentId: deptIT.id,
    },
  });

  const pbxAdminPassword = await bcrypt.hash('PbxAdmin@2026!', 10);
  await prisma.user.upsert({
    where: { username: 'pbxadmin' },
    update: { passwordHash: pbxAdminPassword },
    create: {
      username: 'pbxadmin',
      email: 'pbxadmin@eclypetechnology.com',
      passwordHash: pbxAdminPassword,
      firstName: 'PBX',
      lastName: 'Administrator',
      role: Role.PBX_ADMIN,
      departmentId: deptIT.id,
    },
  });

  const supervisorPassword = await bcrypt.hash('Supervisor@2026!', 10);
  await prisma.user.upsert({
    where: { username: 'supervisor' },
    update: { passwordHash: supervisorPassword },
    create: {
      username: 'supervisor',
      email: 'supervisor@eclypetechnology.com',
      passwordHash: supervisorPassword,
      firstName: 'Call Center',
      lastName: 'Supervisor',
      role: Role.QUEUE_SUPERVISOR,
      departmentId: deptSupport.id,
    },
  });

  const alicePassword = await bcrypt.hash('Alice@Ext1001!', 10);
  const userAlice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: { passwordHash: alicePassword },
    create: {
      username: 'alice',
      email: 'alice@eclypetechnology.com',
      passwordHash: alicePassword,
      firstName: 'Alice',
      lastName: 'Smith',
      role: Role.STANDARD_USER,
      departmentId: deptIT.id,
    },
  });

  const bobPassword = await bcrypt.hash('Bob@Ext1002!', 10);
  const userBob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: { passwordHash: bobPassword },
    create: {
      username: 'bob',
      email: 'bob@eclypetechnology.com',
      passwordHash: bobPassword,
      firstName: 'Bob',
      lastName: 'Jones',
      role: Role.STANDARD_USER,
      departmentId: deptSupport.id,
    },
  });

  const auditorPassword = await bcrypt.hash('Auditor@2026!', 10);
  await prisma.user.upsert({
    where: { username: 'auditor' },
    update: { passwordHash: auditorPassword },
    create: {
      username: 'auditor',
      email: 'auditor@eclypetechnology.com',
      passwordHash: auditorPassword,
      firstName: 'Security',
      lastName: 'Auditor',
      role: Role.AUDITOR,
      departmentId: deptIT.id,
    },
  });

  console.log('Users seeded.');

  // 3. Create Extensions
  const realm = '49.156.43.92';

  const ext1001 = await prisma.extension.upsert({
    where: { extensionNumber: '1001' },
    update: {},
    create: {
      extensionNumber: '1001',
      displayName: 'Alice Smith',
      userId: userAlice.id,
      departmentId: deptIT.id,
      sipPasswordHash: generateSipHa1('1001', realm, 'EclypeExt1001!'),
      sipPasswordEncrypted: encryptPassword('EclypeExt1001!'),
      enabled: true,
      callWaiting: true,
      maxCalls: 3,
      outboundClass: OutboundClass.DOMESTIC,
      recordCalls: RecordPolicy.ALWAYS,
    },
  });

  const ext1002 = await prisma.extension.upsert({
    where: { extensionNumber: '1002' },
    update: {},
    create: {
      extensionNumber: '1002',
      displayName: 'Bob Jones',
      userId: userBob.id,
      departmentId: deptSupport.id,
      sipPasswordHash: generateSipHa1('1002', realm, 'EclypeExt1002!'),
      sipPasswordEncrypted: encryptPassword('EclypeExt1002!'),
      enabled: true,
      callWaiting: true,
      maxCalls: 3,
      outboundClass: OutboundClass.DOMESTIC,
      recordCalls: RecordPolicy.ALWAYS,
    },
  });

  const ext1003 = await prisma.extension.upsert({
    where: { extensionNumber: '1003' },
    update: {},
    create: {
      extensionNumber: '1003',
      displayName: 'Sales Agent',
      departmentId: deptSales.id,
      sipPasswordHash: generateSipHa1('1003', realm, 'EclypeExt1003!'),
      sipPasswordEncrypted: encryptPassword('EclypeExt1003!'),
      enabled: true,
      callWaiting: true,
      maxCalls: 2,
      outboundClass: OutboundClass.INTERNATIONAL,
    },
  });

  console.log('Extensions seeded.');

  // Voicemail boxes
  await prisma.voicemailBox.upsert({
    where: { extensionId: ext1001.id },
    update: {},
    create: {
      extensionId: ext1001.id,
      mailbox: '1001',
      pin: '1001',
      emailNotification: 'alice@eclypetechnology.com',
      attachAudio: true,
    },
  });

  await prisma.voicemailBox.upsert({
    where: { extensionId: ext1002.id },
    update: {},
    create: {
      extensionId: ext1002.id,
      mailbox: '1002',
      pin: '1002',
      emailNotification: 'bob@eclypetechnology.com',
      attachAudio: true,
    },
  });

  // 4. Create Sample SIP Trunk
  const primaryTrunk = await prisma.sipTrunk.upsert({
    where: { name: 'Main-SIP-Trunk' },
    update: {},
    create: {
      name: 'Main-SIP-Trunk',
      provider: 'Eclype Technology Carrier Services',
      serverAddress: 'sip.eclypecarrier.net',
      serverPort: 5060,
      transport: TrunkTransport.UDP,
      authMode: TrunkAuthMode.REGISTRATION,
      authUsername: 'eclype_trunk_user',
      authPasswordEncrypted: encryptPassword('TrunkSecret2026!'),
      outboundCallerId: '+18005550100',
      callerIdName: 'Eclype Technology',
      maxConcurrent: 20,
      enabled: true,
      status: TrunkStatus.REGISTERED,
    },
  });

  // 5. Inbound Route (DID mapping)
  await prisma.inboundRoute.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Main Office Inbound DID',
      didNumber: '+18005550100',
      trunkId: primaryTrunk.id,
      timeConditionEnabled: true,
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      businessDays: 'MON,TUE,WED,THU,FRI',
      destinationType: DestinationType.IVR,
      destinationTarget: '7000',
      afterHoursDestinationType: DestinationType.VOICEMAIL,
      afterHoursTarget: '1001',
      recordCalls: true,
      priority: 1,
    },
  });

  // 6. Outbound Route
  await prisma.outboundRoute.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Standard E.164 & Local Outbound',
      dialPattern: '^\\+?[1-9]\\d{6,14}$',
      stripDigits: 0,
      primaryTrunkId: primaryTrunk.id,
      allowedClass: OutboundClass.LOCAL,
      priority: 10,
      enabled: true,
    },
  });

  // 7. IVR Menu (Extension 7000)
  const ivr = await prisma.ivrMenu.upsert({
    where: { extensionNumber: '7000' },
    update: {},
    create: {
      name: 'Main Company IVR',
      extensionNumber: '7000',
      audioPromptFile: '/var/sounds/ivr-main-greeting.wav',
      timeout: 5,
      maxAttempts: 3,
      timeoutDestType: DestinationType.EXTENSION,
      timeoutTarget: '1001',
      invalidDestType: DestinationType.EXTENSION,
      invalidTarget: '1001',
      enabled: true,
    },
  });

  // IVR Options
  await prisma.ivrOption.upsert({
    where: { ivrMenuId_digit: { ivrMenuId: ivr.id, digit: '1' } },
    update: {},
    create: {
      ivrMenuId: ivr.id,
      digit: '1',
      destinationType: DestinationType.QUEUE,
      destinationTarget: '6000',
      description: 'Sales and Support Queue',
    },
  });

  await prisma.ivrOption.upsert({
    where: { ivrMenuId_digit: { ivrMenuId: ivr.id, digit: '2' } },
    update: {},
    create: {
      ivrMenuId: ivr.id,
      digit: '2',
      destinationType: DestinationType.RING_GROUP,
      destinationTarget: '8000',
      description: 'IT Systems Ring Group',
    },
  });

  await prisma.ivrOption.upsert({
    where: { ivrMenuId_digit: { ivrMenuId: ivr.id, digit: '0' } },
    update: {},
    create: {
      ivrMenuId: ivr.id,
      digit: '0',
      destinationType: DestinationType.EXTENSION,
      destinationTarget: '1001',
      description: 'Receptionist / Alice Smith',
    },
  });

  // 8. Ring Group (8000)
  const ringGroup = await prisma.ringGroup.upsert({
    where: { groupNumber: '8000' },
    update: {},
    create: {
      groupNumber: '8000',
      name: 'IT Operations Ring Group',
      strategy: RingStrategy.SIMULTANEOUS,
      ringTimeout: 25,
      fallbackDestType: DestinationType.VOICEMAIL,
      fallbackTarget: '1001',
      enabled: true,
    },
  });

  await prisma.ringGroupMember.upsert({
    where: { ringGroupId_extensionId: { ringGroupId: ringGroup.id, extensionId: ext1001.id } },
    update: {},
    create: {
      ringGroupId: ringGroup.id,
      extensionId: ext1001.id,
      priority: 1,
    },
  });

  await prisma.ringGroupMember.upsert({
    where: { ringGroupId_extensionId: { ringGroupId: ringGroup.id, extensionId: ext1002.id } },
    update: {},
    create: {
      ringGroupId: ringGroup.id,
      extensionId: ext1002.id,
      priority: 2,
    },
  });

  // 9. Call Queue (6000)
  const queue = await prisma.callQueue.upsert({
    where: { queueNumber: '6000' },
    update: {},
    create: {
      queueNumber: '6000',
      name: 'Customer Service Queue',
      strategy: QueueStrategy.LONGEST_IDLE_AGENT,
      maxWaitTime: 300,
      maxQueueSize: 20,
      wrapUpTime: 15,
      overflowDestType: DestinationType.VOICEMAIL,
      overflowTarget: '1002',
      enabled: true,
    },
  });

  await prisma.queueAgent.upsert({
    where: { callQueueId_extensionId: { callQueueId: queue.id, extensionId: ext1001.id } },
    update: {},
    create: {
      callQueueId: queue.id,
      extensionId: ext1001.id,
      tier: 1,
      status: AgentStatus.LOGGED_IN,
    },
  });

  await prisma.queueAgent.upsert({
    where: { callQueueId_extensionId: { callQueueId: queue.id, extensionId: ext1002.id } },
    update: {},
    create: {
      callQueueId: queue.id,
      extensionId: ext1002.id,
      tier: 1,
      status: AgentStatus.LOGGED_IN,
    },
  });

  // 10. System Settings
  const settings = [
    { key: 'PBX_HOSTNAME', value: 'pbx.eclypetechnology.local', category: 'NETWORK', description: 'Fully Qualified Domain Name of PBX host' },
    { key: 'PBX_PUBLIC_IP', value: '49.156.43.92', category: 'NETWORK', description: 'Primary IPv4 listening address' },
    { key: 'SIP_INTERNAL_PORT', value: '5060', category: 'SIP', description: 'SIP Internal registration port' },
    { key: 'WEBRTC_WSS_PORT', value: '5066', category: 'SIP', description: 'WebRTC WSS SIP signaling port' },
    { key: 'RTP_PORT_RANGE', value: '16384-32768', category: 'SIP', description: 'UDP port range for RTP voice transport' },
    { key: 'AUDIO_CODECS', value: 'OPUS,G722,PCMU,PCMA', category: 'SIP', description: 'Preferred audio codecs order' },
    { key: 'CALL_RECORDING_RETENTION_DAYS', value: '90', category: 'RECORDING', description: 'Default retention policy for call recordings' },
    { key: 'TOLL_FRAUD_MAX_CONCURRENT', value: '15', category: 'SECURITY', description: 'Alert threshold for concurrent outbound calls' },
    { key: 'SYSTEM_TIMEZONE', value: 'UTC', category: 'SYSTEM', description: 'Default time zone for business hours and CDRs' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 11. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      username: 'admin',
      action: 'SYSTEM_INITIALIZATION',
      resource: 'System',
      resourceId: 'INIT',
      details: { version: '1.0.0', phase: 'Phase 2 Database Setup' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('Seeding complete! Database successfully populated with initial enterprise PBX data.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
