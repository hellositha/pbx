-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PBX_ADMIN', 'DEPT_MANAGER', 'QUEUE_SUPERVISOR', 'RECEPTIONIST', 'STANDARD_USER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "OutboundClass" AS ENUM ('INTERNAL', 'LOCAL', 'DOMESTIC', 'INTERNATIONAL', 'UNRESTRICTED');

-- CreateEnum
CREATE TYPE "RecordPolicy" AS ENUM ('ALWAYS', 'INBOUND_ONLY', 'OUTBOUND_ONLY', 'NEVER');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'RINGING', 'ON_CALL');

-- CreateEnum
CREATE TYPE "TrunkTransport" AS ENUM ('UDP', 'TCP', 'TLS');

-- CreateEnum
CREATE TYPE "TrunkAuthMode" AS ENUM ('REGISTRATION', 'IP_BASED');

-- CreateEnum
CREATE TYPE "TrunkStatus" AS ENUM ('REGISTERED', 'UNREGISTERED', 'FAILED', 'DISABLED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('EXTENSION', 'RING_GROUP', 'IVR', 'QUEUE', 'VOICEMAIL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "RingStrategy" AS ENUM ('SIMULTANEOUS', 'SEQUENTIAL', 'ROUND_ROBIN', 'RANDOM');

-- CreateEnum
CREATE TYPE "QueueStrategy" AS ENUM ('LONGEST_IDLE_AGENT', 'ROUND_ROBIN', 'RING_ALL');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('LOGGED_IN', 'LOGGED_OUT', 'ON_CALL', 'PAUSED');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CallDisposition" AS ENUM ('ANSWERED', 'NO_ANSWER', 'BUSY', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('FAILED_SIP_REGISTRATION', 'BRUTE_FORCE_LOGIN', 'TOLL_FRAUD_SPIKE', 'UNAUTHORIZED_TRUNK_ACCESS');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STANDARD_USER',
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extension" (
    "id" TEXT NOT NULL,
    "extensionNumber" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "userId" TEXT,
    "departmentId" TEXT,
    "sipPasswordHash" TEXT NOT NULL,
    "sipPasswordEncrypted" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "callWaiting" BOOLEAN NOT NULL DEFAULT true,
    "maxCalls" INTEGER NOT NULL DEFAULT 2,
    "outboundClass" "OutboundClass" NOT NULL DEFAULT 'LOCAL',
    "dnd" BOOLEAN NOT NULL DEFAULT false,
    "forwardAlways" TEXT,
    "forwardBusy" TEXT,
    "forwardNoAnswer" TEXT,
    "noAnswerTimeout" INTEGER NOT NULL DEFAULT 25,
    "recordCalls" "RecordPolicy" NOT NULL DEFAULT 'NEVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionDevice" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL DEFAULT 'SIP',
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "port" INTEGER,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "registeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ExtensionDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoicemailBox" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "emailNotification" TEXT,
    "attachAudio" BOOLEAN NOT NULL DEFAULT false,
    "greetingFile" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoicemailBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SipTrunk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "serverAddress" TEXT NOT NULL,
    "serverPort" INTEGER NOT NULL DEFAULT 5060,
    "transport" "TrunkTransport" NOT NULL DEFAULT 'UDP',
    "authMode" "TrunkAuthMode" NOT NULL DEFAULT 'REGISTRATION',
    "authUsername" TEXT,
    "authPasswordEncrypted" TEXT,
    "outboundCallerId" TEXT,
    "callerIdName" TEXT,
    "registerExpires" INTEGER NOT NULL DEFAULT 3600,
    "maxConcurrent" INTEGER NOT NULL DEFAULT 10,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "TrunkStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastRegisteredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SipTrunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "didNumber" TEXT NOT NULL,
    "trunkId" TEXT,
    "timeConditionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "businessDays" TEXT,
    "destinationType" "DestinationType" NOT NULL,
    "destinationTarget" TEXT NOT NULL,
    "afterHoursDestinationType" "DestinationType",
    "afterHoursTarget" TEXT,
    "recordCalls" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboundRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dialPattern" TEXT NOT NULL,
    "stripDigits" INTEGER NOT NULL DEFAULT 0,
    "prependDigits" TEXT,
    "primaryTrunkId" TEXT NOT NULL,
    "failoverTrunkId" TEXT,
    "allowedClass" "OutboundClass" NOT NULL DEFAULT 'LOCAL',
    "customCallerId" TEXT,
    "maxCallDuration" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IvrMenu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "extensionNumber" TEXT NOT NULL,
    "audioPromptFile" TEXT NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 5,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "timeoutDestType" "DestinationType" NOT NULL DEFAULT 'VOICEMAIL',
    "timeoutTarget" TEXT NOT NULL DEFAULT '1000',
    "invalidDestType" "DestinationType" NOT NULL DEFAULT 'VOICEMAIL',
    "invalidTarget" TEXT NOT NULL DEFAULT '1000',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IvrMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IvrOption" (
    "id" TEXT NOT NULL,
    "ivrMenuId" TEXT NOT NULL,
    "digit" TEXT NOT NULL,
    "destinationType" "DestinationType" NOT NULL,
    "destinationTarget" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IvrOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RingGroup" (
    "id" TEXT NOT NULL,
    "groupNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" "RingStrategy" NOT NULL DEFAULT 'SIMULTANEOUS',
    "ringTimeout" INTEGER NOT NULL DEFAULT 20,
    "fallbackDestType" "DestinationType" NOT NULL DEFAULT 'VOICEMAIL',
    "fallbackTarget" TEXT NOT NULL DEFAULT '1000',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RingGroupMember" (
    "id" TEXT NOT NULL,
    "ringGroupId" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RingGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallQueue" (
    "id" TEXT NOT NULL,
    "queueNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" "QueueStrategy" NOT NULL DEFAULT 'LONGEST_IDLE_AGENT',
    "maxWaitTime" INTEGER NOT NULL DEFAULT 300,
    "maxQueueSize" INTEGER NOT NULL DEFAULT 20,
    "musicOnHold" TEXT NOT NULL DEFAULT 'local_stream://moh',
    "wrapUpTime" INTEGER NOT NULL DEFAULT 15,
    "overflowDestType" "DestinationType" NOT NULL DEFAULT 'VOICEMAIL',
    "overflowTarget" TEXT NOT NULL DEFAULT '1000',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueAgent" (
    "id" TEXT NOT NULL,
    "callQueueId" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "status" "AgentStatus" NOT NULL DEFAULT 'LOGGED_OUT',

    CONSTRAINT "QueueAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRecord" (
    "id" TEXT NOT NULL,
    "callUuid" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "callerIdNum" TEXT NOT NULL,
    "callerIdName" TEXT,
    "destination" TEXT NOT NULL,
    "sourceExtension" TEXT,
    "destExtension" TEXT,
    "trunkId" TEXT,
    "disposition" "CallDisposition" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "answerTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "billsec" INTEGER NOT NULL DEFAULT 0,
    "hangupCause" TEXT NOT NULL,
    "hasRecording" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRecording" (
    "id" TEXT NOT NULL,
    "callRecordId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "duration" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'wav',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "includesRecordings" BOOLEAN NOT NULL DEFAULT false,
    "status" "BackupStatus" NOT NULL DEFAULT 'SUCCESS',
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "sourceIp" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "AuditLog_resource_action_idx" ON "AuditLog"("resource", "action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Extension_extensionNumber_key" ON "Extension"("extensionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Extension_userId_key" ON "Extension"("userId");

-- CreateIndex
CREATE INDEX "Extension_enabled_idx" ON "Extension"("enabled");

-- CreateIndex
CREATE INDEX "ExtensionDevice_extensionId_idx" ON "ExtensionDevice"("extensionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoicemailBox_extensionId_key" ON "VoicemailBox"("extensionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoicemailBox_mailbox_key" ON "VoicemailBox"("mailbox");

-- CreateIndex
CREATE UNIQUE INDEX "SipTrunk_name_key" ON "SipTrunk"("name");

-- CreateIndex
CREATE INDEX "InboundRoute_didNumber_idx" ON "InboundRoute"("didNumber");

-- CreateIndex
CREATE INDEX "InboundRoute_enabled_idx" ON "InboundRoute"("enabled");

-- CreateIndex
CREATE INDEX "OutboundRoute_priority_idx" ON "OutboundRoute"("priority");

-- CreateIndex
CREATE INDEX "OutboundRoute_enabled_idx" ON "OutboundRoute"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "IvrMenu_extensionNumber_key" ON "IvrMenu"("extensionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IvrOption_ivrMenuId_digit_key" ON "IvrOption"("ivrMenuId", "digit");

-- CreateIndex
CREATE UNIQUE INDEX "RingGroup_groupNumber_key" ON "RingGroup"("groupNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RingGroupMember_ringGroupId_extensionId_key" ON "RingGroupMember"("ringGroupId", "extensionId");

-- CreateIndex
CREATE UNIQUE INDEX "CallQueue_queueNumber_key" ON "CallQueue"("queueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QueueAgent_callQueueId_extensionId_key" ON "QueueAgent"("callQueueId", "extensionId");

-- CreateIndex
CREATE UNIQUE INDEX "CallRecord_callUuid_key" ON "CallRecord"("callUuid");

-- CreateIndex
CREATE INDEX "CallRecord_startTime_idx" ON "CallRecord"("startTime");

-- CreateIndex
CREATE INDEX "CallRecord_sourceExtension_idx" ON "CallRecord"("sourceExtension");

-- CreateIndex
CREATE INDEX "CallRecord_destExtension_idx" ON "CallRecord"("destExtension");

-- CreateIndex
CREATE INDEX "CallRecord_destination_idx" ON "CallRecord"("destination");

-- CreateIndex
CREATE INDEX "CallRecord_disposition_idx" ON "CallRecord"("disposition");

-- CreateIndex
CREATE UNIQUE INDEX "CallRecording_callRecordId_key" ON "CallRecording"("callRecordId");

-- CreateIndex
CREATE INDEX "CallRecording_createdAt_idx" ON "CallRecording"("createdAt");

-- CreateIndex
CREATE INDEX "BackupJob_createdAt_idx" ON "BackupJob"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_sourceIp_idx" ON "SecurityEvent"("sourceIp");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extension" ADD CONSTRAINT "Extension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extension" ADD CONSTRAINT "Extension_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionDevice" ADD CONSTRAINT "ExtensionDevice_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "Extension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoicemailBox" ADD CONSTRAINT "VoicemailBox_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "Extension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundRoute" ADD CONSTRAINT "InboundRoute_trunkId_fkey" FOREIGN KEY ("trunkId") REFERENCES "SipTrunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundRoute" ADD CONSTRAINT "OutboundRoute_primaryTrunkId_fkey" FOREIGN KEY ("primaryTrunkId") REFERENCES "SipTrunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundRoute" ADD CONSTRAINT "OutboundRoute_failoverTrunkId_fkey" FOREIGN KEY ("failoverTrunkId") REFERENCES "SipTrunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IvrOption" ADD CONSTRAINT "IvrOption_ivrMenuId_fkey" FOREIGN KEY ("ivrMenuId") REFERENCES "IvrMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RingGroupMember" ADD CONSTRAINT "RingGroupMember_ringGroupId_fkey" FOREIGN KEY ("ringGroupId") REFERENCES "RingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RingGroupMember" ADD CONSTRAINT "RingGroupMember_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "Extension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueAgent" ADD CONSTRAINT "QueueAgent_callQueueId_fkey" FOREIGN KEY ("callQueueId") REFERENCES "CallQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueAgent" ADD CONSTRAINT "QueueAgent_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "Extension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_trunkId_fkey" FOREIGN KEY ("trunkId") REFERENCES "SipTrunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecording" ADD CONSTRAINT "CallRecording_callRecordId_fkey" FOREIGN KEY ("callRecordId") REFERENCES "CallRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
