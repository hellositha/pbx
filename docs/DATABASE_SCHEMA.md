# Eclype Technology PBX - Database Schema Specification

This document details the relational database schema implemented in **PostgreSQL 18** managed via **Prisma ORM**.

---

## 1. Schema Entity Relationship Summary

* **Identity & Access Management:** `User`, `Role`, `Department`, `AuditLog`
* **Telephony Endpoints:** `Extension`, `ExtensionDevice`, `VoicemailBox`
* **SIP Trunks & Routing:** `SipTrunk`, `InboundRoute`, `OutboundRoute`
* **Call Distribution:** `IvrMenu`, `IvrOption`, `RingGroup`, `RingGroupMember`, `CallQueue`, `QueueAgent`
* **Telemetry & Recordings:** `CallRecord` (CDR), `CallRecording`
* **System Operations:** `SystemSetting`, `BackupJob`, `SecurityEvent`

---

## 2. Table Definitions

### 2.1 Identity & Access Control

#### `User`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, default uuid_generate_v4() | Unique user identifier |
| `username` | VARCHAR(64) | UNIQUE, NOT NULL | Login username |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Contact/login email |
| `passwordHash` | VARCHAR(255) | NOT NULL | Argon2id / bcrypt password hash |
| `firstName` | VARCHAR(64) | NOT NULL | User first name |
| `lastName` | VARCHAR(64) | NOT NULL | User last name |
| `role` | ENUM | NOT NULL, DEFAULT 'STANDARD_USER' | SUPER_ADMIN, PBX_ADMIN, DEPT_MANAGER, QUEUE_SUPERVISOR, RECEPTIONIST, STANDARD_USER, AUDITOR |
| `departmentId` | UUID | NULL, FOREIGN KEY -> Department(id) | Associated department |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Account status flag |
| `mfaEnabled` | BOOLEAN | NOT NULL, DEFAULT false | Multi-factor authentication flag |
| `mfaSecret` | VARCHAR(128) | NULL | Encrypted TOTP secret |
| `failedLoginAttempts`| INTEGER | NOT NULL, DEFAULT 0 | Failed login attempts counter |
| `lockedUntil` | TIMESTAMP | NULL | Lockout expiration timestamp |
| `lastLoginAt` | TIMESTAMP | NULL | Last successful authentication |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | Last modification timestamp |

#### `Department`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(64) | UNIQUE, NOT NULL | Department name (IT, Sales, etc.) |
| `code` | VARCHAR(16) | UNIQUE, NOT NULL | Short code (e.g., IT, SALES) |
| `description` | TEXT | NULL | Department details |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Created timestamp |

#### `AuditLog`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `userId` | UUID | NULL, FOREIGN KEY -> User(id) | User who executed the action |
| `username` | VARCHAR(64) | NOT NULL | Snapshot of username |
| `action` | VARCHAR(64) | NOT NULL | CREATE, UPDATE, DELETE, LOGIN, RELOAD |
| `resource` | VARCHAR(64) | NOT NULL | Target resource (e.g., Extension, Trunk) |
| `resourceId` | VARCHAR(128) | NULL | Identifier of modified entity |
| `details` | JSONB | NULL | Metadata or changes diff |
| `ipAddress` | VARCHAR(45) | NOT NULL | Client IP address |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Log timestamp |

---

### 2.2 Telephony Endpoints

#### `Extension`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `extensionNumber` | VARCHAR(16) | UNIQUE, NOT NULL | SIP extension number (e.g., 1001) |
| `displayName` | VARCHAR(128) | NOT NULL | Caller ID name |
| `userId` | UUID | UNIQUE, NULL, FK -> User(id) | Assigned user |
| `departmentId` | UUID | NULL, FK -> Department(id) | Assigned department |
| `sipPasswordHash` | VARCHAR(255) | NOT NULL | FreeSWITCH SIP auth HA1 / password hash |
| `sipPasswordEncrypted`| TEXT | NOT NULL | AES-256 encrypted password for provisioning |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Administrative status |
| `callWaiting` | BOOLEAN | NOT NULL, DEFAULT true | Call waiting enabled |
| `maxCalls` | INTEGER | NOT NULL, DEFAULT 2 | Max concurrent channels |
| `outboundClass` | ENUM | NOT NULL, DEFAULT 'LOCAL' | INTERNAL, LOCAL, DOMESTIC, INTERNATIONAL, UNRESTRICTED |
| `dnd` | BOOLEAN | NOT NULL, DEFAULT false | Do-Not-Disturb flag |
| `forwardAlways` | VARCHAR(32) | NULL | Unconditional forward destination |
| `forwardBusy` | VARCHAR(32) | NULL | Busy fallback destination |
| `forwardNoAnswer` | VARCHAR(32) | NULL | No-answer fallback destination |
| `noAnswerTimeout`| INTEGER | NOT NULL, DEFAULT 25 | Seconds to ring before fallback |
| `recordCalls` | ENUM | NOT NULL, DEFAULT 'NEVER' | ALWAYS, INBOUND_ONLY, OUTBOUND_ONLY, NEVER |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Created timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | Modified timestamp |

#### `ExtensionDevice`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `extensionId` | UUID | NOT NULL, FK -> Extension(id) | Parent extension |
| `deviceType` | VARCHAR(32) | NOT NULL | WEBRTC, DESKPHONE, SOFTPHONE |
| `userAgent` | VARCHAR(255) | NULL | Registered SIP user agent string |
| `ipAddress` | VARCHAR(45) | NULL | Contact IP address |
| `port` | INTEGER | NULL | Contact SIP port |
| `status` | ENUM | NOT NULL, DEFAULT 'OFFLINE' | ONLINE, OFFLINE, RINGING, ON_CALL |
| `registeredAt` | TIMESTAMP | NULL | Registration timestamp |
| `expiresAt` | TIMESTAMP | NULL | Registration expiry |

#### `VoicemailBox`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `extensionId` | UUID | UNIQUE, NOT NULL, FK -> Extension(id) | Assigned extension |
| `mailbox` | VARCHAR(16) | UNIQUE, NOT NULL | Mailbox ID |
| `pin` | VARCHAR(16) | NOT NULL | Voicemail numeric PIN |
| `emailNotification` | VARCHAR(255) | NULL | Email address for alerts |
| `attachAudio` | BOOLEAN | NOT NULL, DEFAULT false | Attach audio file to email |
| `greetingFile` | VARCHAR(255) | NULL | Path to custom greeting WAV |
| `messageCount` | INTEGER | NOT NULL, DEFAULT 0 | Count of active messages |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Created timestamp |

---

### 2.3 SIP Trunks & Routing

#### `SipTrunk`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(64) | UNIQUE, NOT NULL | Friendly trunk name |
| `provider` | VARCHAR(64) | NOT NULL | SIP carrier/provider name |
| `serverAddress` | VARCHAR(255) | NOT NULL | SIP Proxy / Registrar hostname or IP |
| `serverPort` | INTEGER | NOT NULL, DEFAULT 5060 | SIP Port |
| `transport` | ENUM | NOT NULL, DEFAULT 'UDP' | UDP, TCP, TLS |
| `authMode` | ENUM | NOT NULL, DEFAULT 'REGISTRATION' | REGISTRATION, IP_BASED |
| `authUsername` | VARCHAR(128) | NULL | Authentication username |
| `authPasswordEncrypted` | TEXT | NULL | AES-256 encrypted password |
| `outboundCallerId`| VARCHAR(64) | NULL | Default caller ID number |
| `callerIdName` | VARCHAR(64) | NULL | Default caller ID name |
| `registerExpires`| INTEGER | NOT NULL, DEFAULT 3600 | Expiration in seconds |
| `maxConcurrent` | INTEGER | NOT NULL, DEFAULT 10 | Trunk channel limit |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Active state |
| `status` | ENUM | NOT NULL, DEFAULT 'UNKNOWN' | REGISTERED, UNREGISTERED, FAILED, DISABLED |
| `lastRegisteredAt` | TIMESTAMP | NULL | Last registration success |
| `lastError` | TEXT | NULL | Last SIP error code/reason |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Created timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | Modified timestamp |

#### `InboundRoute`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(64) | NOT NULL | Route friendly name |
| `didNumber` | VARCHAR(64) | NOT NULL | Inbound dialed number / DID pattern |
| `trunkId` | UUID | NULL, FK -> SipTrunk(id) | Associated trunk (or any if null) |
| `timeConditionEnabled` | BOOLEAN | NOT NULL, DEFAULT false | Whether business hours apply |
| `businessHoursStart` | VARCHAR(8) | NULL | e.g. "09:00" |
| `businessHoursEnd` | VARCHAR(8) | NULL | e.g. "17:00" |
| `businessDays` | VARCHAR(32) | NULL | e.g. "MON,TUE,WED,THU,FRI" |
| `destinationType` | ENUM | NOT NULL | EXTENSION, RING_GROUP, IVR, QUEUE, VOICEMAIL, EXTERNAL |
| `destinationTarget` | VARCHAR(64) | NOT NULL | Target ID or number |
| `afterHoursDestinationType` | ENUM | NULL | Fallback destination type |
| `afterHoursTarget` | VARCHAR(64) | NULL | Fallback destination target |
| `recordCalls` | BOOLEAN | NOT NULL, DEFAULT false | Route-level recording flag |
| `priority` | INTEGER | NOT NULL, DEFAULT 10 | Route match evaluation order |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Route enabled flag |

#### `OutboundRoute`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(64) | NOT NULL | Route name (e.g. Local Calls, International) |
| `dialPattern` | VARCHAR(128) | NOT NULL | Dial regex / pattern (e.g. ^0[1-9]\d+$) |
| `stripDigits` | INTEGER | NOT NULL, DEFAULT 0 | Leading digits to trim |
| `prependDigits` | VARCHAR(16) | NULL | Digits to prepend |
| `primaryTrunkId` | UUID | NOT NULL, FK -> SipTrunk(id) | Primary egress gateway |
| `failoverTrunkId` | UUID | NULL, FK -> SipTrunk(id) | Secondary failover gateway |
| `allowedClass` | ENUM | NOT NULL, DEFAULT 'LOCAL' | Permitted caller permission class |
| `customCallerId` | VARCHAR(32) | NULL | Override caller ID |
| `maxCallDuration` | INTEGER | NULL | Max call limit in seconds |
| `priority` | INTEGER | NOT NULL, DEFAULT 10 | Matching precedence |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Enabled flag |

---

### 2.4 Call Routing Features (IVR, Ring Groups, Queues)

#### `IvrMenu`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(64) | NOT NULL | Menu name |
| `extensionNumber` | VARCHAR(16) | UNIQUE, NOT NULL | Direct dial IVR extension (e.g. 7000) |
| `audioPromptFile` | VARCHAR(255) | NOT NULL | Prompt greeting audio path |
| `timeout` | INTEGER | NOT NULL, DEFAULT 5 | Timeout waiting for DTMF in seconds |
| `maxAttempts` | INTEGER | NOT NULL, DEFAULT 3 | Max invalid attempts before fallback |
| `timeoutDestType` | ENUM | NOT NULL | Fallback destination on timeout |
| `timeoutTarget` | VARCHAR(64) | NOT NULL | Fallback destination target |
| `invalidDestType` | ENUM | NOT NULL | Fallback destination on invalid key |
| `invalidTarget` | VARCHAR(64) | NOT NULL | Fallback target |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Menu status |

#### `IvrOption`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ivrMenuId` | UUID | NOT NULL, FK -> IvrMenu(id) | Parent menu |
| `digit` | VARCHAR(4) | NOT NULL | Pressed DTMF digit (0-9, *, #) |
| `destinationType` | ENUM | NOT NULL | EXTENSION, RING_GROUP, IVR, QUEUE, VOICEMAIL, EXTERNAL |
| `destinationTarget` | VARCHAR(64) | NOT NULL | Target identifier |
| `description` | VARCHAR(128) | NULL | Option description (e.g. Press 1 for Sales) |

#### `RingGroup`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `groupNumber` | VARCHAR(16) | UNIQUE, NOT NULL | Group extension number (e.g. 8000) |
| `name` | VARCHAR(64) | NOT NULL | Friendly name |
| `strategy` | ENUM | NOT NULL, DEFAULT 'SIMULTANEOUS' | SIMULTANEOUS, SEQUENTIAL, ROUND_ROBIN, RANDOM |
| `ringTimeout` | INTEGER | NOT NULL, DEFAULT 20 | Ringing duration before fallback |
| `fallbackDestType`| ENUM | NOT NULL | Fallback destination type |
| `fallbackTarget` | VARCHAR(64) | NOT NULL | Fallback target |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Status flag |

#### `RingGroupMember`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `ringGroupId` | UUID | NOT NULL, FK -> RingGroup(id) | Parent ring group |
| `extensionId` | UUID | NOT NULL, FK -> Extension(id) | Member extension |
| `priority` | INTEGER | NOT NULL, DEFAULT 1 | Priority / order for sequential ring |

#### `CallQueue`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `queueNumber` | VARCHAR(16) | UNIQUE, NOT NULL | Queue dial extension (e.g. 6000) |
| `name` | VARCHAR(64) | NOT NULL | Queue name |
| `strategy` | ENUM | NOT NULL, DEFAULT 'LONGEST_IDLE_AGENT' | LONGEST_IDLE_AGENT, ROUND_ROBIN, RING_ALL |
| `maxWaitTime` | INTEGER | NOT NULL, DEFAULT 300 | Max queue hold in seconds |
| `maxQueueSize` | INTEGER | NOT NULL, DEFAULT 20 | Max waiting callers |
| `musicOnHold` | VARCHAR(128) | NOT NULL, DEFAULT 'local_stream://moh' | Hold music stream |
| `wrapUpTime` | INTEGER | NOT NULL, DEFAULT 15 | Post-call wrap up in seconds |
| `overflowDestType`| ENUM | NOT NULL | Fallback destination on overflow |
| `overflowTarget` | VARCHAR(64) | NOT NULL | Fallback target |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Queue status |

#### `QueueAgent`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `callQueueId` | UUID | NOT NULL, FK -> CallQueue(id) | Parent queue |
| `extensionId` | UUID | NOT NULL, FK -> Extension(id) | Assigned extension |
| `tier` | INTEGER | NOT NULL, DEFAULT 1 | Priority tier |
| `status` | ENUM | NOT NULL, DEFAULT 'LOGGED_OUT' | LOGGED_IN, LOGGED_OUT, ON_CALL, PAUSED |

---

### 2.5 Call Records & Audio Recordings

#### `CallRecord` (CDR)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `callUuid` | VARCHAR(64) | UNIQUE, NOT NULL | FreeSWITCH channel UUID |
| `direction` | ENUM | NOT NULL | INBOUND, OUTBOUND, INTERNAL |
| `callerIdNum` | VARCHAR(64) | NOT NULL | Originating number |
| `callerIdName` | VARCHAR(64) | NULL | Originating caller name |
| `destination` | VARCHAR(64) | NOT NULL | Dialed number |
| `sourceExtension`| VARCHAR(16) | NULL | Internal source extension |
| `destExtension` | VARCHAR(16) | NULL | Internal destination extension |
| `trunkId` | UUID | NULL, FK -> SipTrunk(id) | SIP trunk used if external |
| `disposition` | ENUM | NOT NULL | ANSWERED, NO_ANSWER, BUSY, FAILED |
| `startTime` | TIMESTAMP | NOT NULL | Call initialization time |
| `answerTime` | TIMESTAMP | NULL | Call connect time |
| `endTime` | TIMESTAMP | NOT NULL | Call termination time |
| `duration` | INTEGER | NOT NULL, DEFAULT 0 | Total call duration (seconds) |
| `billsec` | INTEGER | NOT NULL, DEFAULT 0 | Talk duration (seconds) |
| `hangupCause` | VARCHAR(64) | NOT NULL | FreeSWITCH termination reason |
| `hasRecording` | BOOLEAN | NOT NULL, DEFAULT false | Whether audio is stored |

#### `CallRecording`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `callRecordId` | UUID | UNIQUE, NOT NULL, FK -> CallRecord(id) | Associated CDR |
| `filePath` | VARCHAR(512) | NOT NULL | Absolute filesystem path |
| `fileSize` | BIGINT | NOT NULL | Size in bytes |
| `duration` | INTEGER | NOT NULL | Audio duration in seconds |
| `format` | VARCHAR(16) | NOT NULL, DEFAULT 'wav' | Audio codec/container |
| `expiresAt` | TIMESTAMP | NULL | Scheduled policy deletion date |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Created timestamp |

---

### 2.6 Operations & Security

#### `SystemSetting`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `key` | VARCHAR(64) | PRIMARY KEY | Unique setting key |
| `value` | TEXT | NOT NULL | Setting value |
| `category` | VARCHAR(32) | NOT NULL | NETWORK, SIP, RECORDING, SECURITY, SYSTEM |
| `description` | VARCHAR(255) | NULL | Setting description |

#### `BackupJob`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `filename` | VARCHAR(255) | NOT NULL | Archive filename |
| `filePath` | VARCHAR(512) | NOT NULL | Absolute file location |
| `fileSize` | BIGINT | NOT NULL | Backup archive size in bytes |
| `includesRecordings`| BOOLEAN | NOT NULL, DEFAULT false | Whether call audio is included |
| `status` | ENUM | NOT NULL, DEFAULT 'SUCCESS' | PENDING, SUCCESS, FAILED |
| `checksum` | VARCHAR(128) | NOT NULL | SHA-256 verification hash |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Completion timestamp |

#### `SecurityEvent`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `eventType` | ENUM | NOT NULL | FAILED_SIP_REGISTRATION, BRUTE_FORCE_LOGIN, TOLL_FRAUD_SPIKE, UNAUTHORIZED_TRUNK_ACCESS |
| `severity` | ENUM | NOT NULL, DEFAULT 'MEDIUM' | LOW, MEDIUM, HIGH, CRITICAL |
| `sourceIp` | VARCHAR(45) | NOT NULL | Offending IP address |
| `details` | JSONB | NOT NULL | Event telemetry context |
| `resolved` | BOOLEAN | NOT NULL, DEFAULT false | Acknowledged flag |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT now() | Event timestamp |
