# Eclype Technology PBX - Repository Structure

This document outlines the source tree, service responsibilities, and deployment paths for **Eclype Technology PBX**.

```
/root/pbx/
├── backend/                             # Node.js + TypeScript PBX REST API & Realtime Server
│   ├── prisma/
│   │   ├── schema.prisma                # Relational database schema definition
│   │   ├── seed.ts                      # Database seeder (roles, superadmin, sample departments)
│   │   └── migrations/                  # Generated Prisma SQL migrations
│   ├── src/
│   │   ├── config/
│   │   │   ├── environment.ts           # Type-safe environment variable parsing
│   │   │   └── constants.ts             # FreeSWITCH port defaults, token expirations, roles
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts       # Login, session verification, MFA, password reset
│   │   │   ├── dashboard.controller.ts  # System health, live counters, resource statistics
│   │   │   ├── extension.controller.ts  # Extension CRUD, credential reset, device lookup
│   │   │   ├── trunk.controller.ts      # SIP trunk config, connectivity test, reload
│   │   │   ├── route.controller.ts      # Inbound & outbound routing rules
│   │   │   ├── ivr.controller.ts        # IVR menu builder, audio prompt management
│   │   │   ├── queue.controller.ts      # Call center queues, agent assignment, strategy
│   │   │   ├── call.controller.ts       # Active call control (hold, transfer, hangup)
│   │   │   ├── cdr.controller.ts        # Call Detail Records query, filtering, CSV export
│   │   │   ├── recording.controller.ts  # Recording playback, authorization tokens, deletion
│   │   │   ├── voicemail.controller.ts  # Voicemail inbox, greeting management
│   │   │   ├── user.controller.ts       # Users, departments, role assignments
│   │   │   ├── system.controller.ts     # Network diagnostics, backups, service management
│   │   │   └── security.controller.ts   # Security events, blocked IPs, toll fraud alerts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # JWT verification & session validation
│   │   │   ├── rbac.middleware.ts       # Role-based access control enforcement
│   │   │   ├── rate-limit.middleware.ts # IP & user rate limiting
│   │   │   ├── audit.middleware.ts      # Automatic audit logging for mutation endpoints
│   │   │   └── error.middleware.ts      # Centralized error handler
│   │   ├── telephony/
│   │   │   ├── esl-client.ts            # FreeSWITCH Event Socket Library TCP client
│   │   │   ├── esl-events.ts            # Event listeners (channels, registrations, recordings)
│   │   │   ├── xml-generator.ts         # Generates directory, dialplan, and profile XML files
│   │   │   ├── config-synchronizer.ts   # Atomic file write, validation & 'reloadxml' trigger
│   │   │   └── softswitch-commands.ts   # High-level call control commands (originate, transfer)
│   │   ├── services/
│   │   │   ├── backup.service.ts        # Encrypted pg_dump & telephony conf archiver
│   │   │   ├── cdr.service.ts           # FreeSWITCH event to PostgreSQL CDR processor
│   │   │   ├── recording.service.ts     # Retention policies & secure audio streamer
│   │   │   ├── trunk-monitor.service.ts # Gateway status poller and latency tester
│   │   │   └── toll-fraud.service.ts    # Rate/destination limit detection engine
│   │   ├── websocket/
│   │   │   ├── ws-server.ts             # WebSocket server instance
│   │   │   └── ws-broadcaster.ts        # Channel for publishing real-time PBX events
│   │   ├── routes/
│   │   │   └── index.ts                 # Aggregated Express API route definitions
│   │   ├── utils/
│   │   │   ├── crypto.ts                # Argon2/bcrypt hashing, SIP HA1 generator, AES encrypt
│   │   │   └── system-stats.ts          # Linux CPU, RAM, Disk, Uptime, Service interrogator
│   │   ├── app.ts                       # Express application bootstrap
│   │   └── server.ts                    # Server entrypoint with HTTP + WS + ESL startup
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── frontend/                            # Next.js 14/15 React Administration & Softphone UI
│   ├── public/                          # Brand assets, logos, audio test samples
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout with providers & toast container
│   │   │   ├── page.tsx                 # Redirect to /dashboard or /login
│   │   │   ├── login/page.tsx           # Enterprise authentication screen
│   │   │   ├── dashboard/page.tsx       # Live status cards, charts, active call activity
│   │   │   ├── extensions/page.tsx      # Extension management, provisioning cards
│   │   │   ├── trunks/page.tsx          # SIP Trunk list, gateway configuration, ping tests
│   │   │   ├── inbound-routes/page.tsx  # DID mapping, time-of-day condition builder
│   │   │   ├── outbound-routes/page.tsx # Dial plans, prefix routing, failover trunks
│   │   │   ├── ivr/page.tsx             # Visual Auto-Attendant editor, digit mapping
│   │   │   ├── ring-groups/page.tsx     # Ring group strategy, ring timeouts, fallbacks
│   │   │   ├── queues/page.tsx          # ACD Call center queue monitor, agent tier lists
│   │   │   ├── active-calls/page.tsx    # Live telephony control table (hold, transfer, drop)
│   │   │   ├── cdr/page.tsx             # Call detail records, search, filter, CSV export
│   │   │   ├── recordings/page.tsx      # Audio player, secure authorization download
│   │   │   ├── voicemail/page.tsx       # Extension voicemail boxes, playback
│   │   │   ├── users/page.tsx           # Administrator & user account management
│   │   │   ├── softphone/page.tsx       # Fullscreen WebRTC dialer & device settings
│   │   │   ├── system-health/page.tsx   # FreeSWITCH status, DB status, system load
│   │   │   ├── security/page.tsx        # Toll fraud alerts, blocked IPs, fail2ban status
│   │   │   ├── backups/page.tsx         # Manual backup trigger, restore wizard, history
│   │   │   ├── settings/page.tsx        # PBX network, SIP interfaces, audio codecs
│   │   │   └── audit-logs/page.tsx      # Administrative audit log explorer
│   │   ├── components/
│   │   │   ├── layout/                  # Enterprise Sidebar, Navbar, Breadcrumbs, UserMenu
│   │   │   ├── softphone/               # Floating & embedded SIP.js WebRTC softphone
│   │   │   ├── ui/                      # Button, Input, Table, Badge, Modal, Tabs, Select
│   │   │   └── common/                  # MetricCard, StatusIndicator, ConfirmDialog, EmptyState
│   │   ├── hooks/
│   │   │   ├── use-auth.ts              # Authentication state, login, logout, role check
│   │   │   ├── use-websocket.ts         # PBX live event stream hook
│   │   │   └── use-softphone.ts         # SIP.js user agent state, active call state
│   │   ├── lib/
│   │   │   ├── api-client.ts            # Axios / Fetch wrapper with token refresh
│   │   │   ├── sip-client.ts            # SIP.js WebRTC initialization, audio stream bindings
│   │   │   └── utils.ts                 # Formatting dates, durations, call states
│   │   └── types/                       # Shared UI TypeScript interfaces
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── package.json
│
├── telephony/                           # FreeSWITCH Configs, Audio Prompts, Directory
│   ├── conf/                            # Generated FreeSWITCH XML configurations
│   │   ├── freeswitch.xml               # Main configuration entrypoint
│   │   ├── vars.xml                     # Global domain, IP, and codec variables
│   │   ├── autoload_configs/            # Modules, ESL, Sofia, Callcenter, Voicemail configs
│   │   ├── directory/                   # Generated SIP extension XML definitions
│   │   ├── dialplan/                    # Generated XML dialplans (default, public, features)
│   │   └── sip_profiles/                # Internal (5060/5066) and External (5080) profiles
│   ├── recordings/                      # Spool directory for active and archived calls
│   └── sounds/                          # Custom audio prompts (IVR, hold music, greetings)
│
├── scripts/                             # Host administration scripts
│   ├── install.sh                       # Guided Ubuntu host installation script
│   ├── upgrade.sh                       # In-place software update script
│   ├── backup.sh                        # CLI backup execution script
│   ├── restore.sh                       # Disaster recovery database & config restoration
│   ├── healthcheck.sh                   # Comprehensive PBX diagnostic health check
│   └── test-telephony.sh                # SIPp automated 2-extension registration & call test
│
├── deploy/                              # Host deployment configurations
│   ├── nginx/
│   │   └── eclypetech-pbx.conf          # Nginx reverse proxy (HTTP, HTTPS, WSS, REST API)
│   ├── systemd/
│   │   ├── asterisk.service             # Asterisk 22 LTS systemd unit file
│   │   ├── eclypetech-backend.service   # Backend Node.js systemd unit file
│   │   └── eclypetech-frontend.service  # Frontend Next.js systemd unit file
│   └── fail2ban/
│       ├── jail.d/freeswitch.local      # Fail2ban jail configuration for FreeSWITCH
│       └── filter.d/freeswitch.conf     # Regex filter for SIP registration failures
│
└── docs/                                # Technical documentation
    ├── SYSTEM_ARCHITECTURE.md           # System design & architecture
    ├── REPOSITORY_STRUCTURE.md          # File & module layout
    ├── DATABASE_SCHEMA.md               # PostgreSQL schema & relationships
    ├── DEVELOPMENT_MILESTONE_PLAN.md    # Phased implementation plan
    └── FIREWALL_AND_PORTS.md            # Networking, ports & security guidelines
```
