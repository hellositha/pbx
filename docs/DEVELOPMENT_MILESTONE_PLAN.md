# Eclype Technology PBX - Development Milestone Plan

This document defines the 6 development phases, milestones, automated acceptance criteria, and verification commands for **Eclype Technology PBX**.

---

## Milestone Roadmap

```
+-------------------------------------------------------------------------------------------------+
| PHASE 1: Telephony Foundation & SIP Verification                                                |
| [X] Inspect host environment & dependencies (Ubuntu 26.04, Node 22, PG 18, Docker FreeSWITCH)   |
| [ ] FreeSWITCH container & host networking setup with mod_sofia & mod_event_socket              |
| [ ] Configure test extensions 1001 & 1002                                                       |
| [ ] Run SIPp automated registration and bidirectional calling test with audio                   |
+-------------------------------------------------------------------------------------------------+
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
| PHASE 2: Core Platform, Authentication, Dashboard & Extension Provisioning                      |
| [ ] PostgreSQL initialization, Prisma migrations, and comprehensive seed data                   |
| [ ] Backend REST API & WebSocket server with JWT auth, RBAC (7 roles), and audit logging        |
| [ ] FreeSWITCH ESL client and dynamic XML configuration synchronization engine                  |
| [ ] Next.js 14/15 administration interface with responsive enterprise layout & live stats        |
| [ ] Full Extension CRUD with real Sofia registration tracking and credential resets             |
+-------------------------------------------------------------------------------------------------+
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
| PHASE 3: Telephony Routing, Trunks, IVR, Ring Groups & ACD Queues                               |
| [ ] SIP Trunk management (Registration & IP-based modes, connectivity test, status poller)      |
| [ ] Inbound routing with DID patterns and business hours schedules                             |
| [ ] Outbound dial plans with permission classes, strip/prepend rules, and trunk failover       |
| [ ] Visual IVR Auto-Attendant configuration with multi-digit menus and fallback destinations     |
| [ ] Ring Groups (Simultaneous, Sequential, Round-Robin) and loop protection                     |
| [ ] ACD Call Queues (mod_callcenter) with agent tiers, wait music, and live queue monitor       |
+-------------------------------------------------------------------------------------------------+
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
| PHASE 4: Telemetry, Recordings, Voicemail & Analytics                                           |
| [ ] CDR ingestion via ESL channel hangup events with call legs, duration, hangup cause          |
| [ ] Call recording pipeline with policy enforcement, secure authorized stream, & retention worker|
| [ ] Voicemail box management and message playback                                               |
| [ ] Searchable CDR reporting table with CSV export, extension/queue metrics, and charts         |
+-------------------------------------------------------------------------------------------------+
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
| PHASE 5: WebRTC Browser Softphone & Operational Management                                      |
| [ ] WebRTC softphone powered by SIP.js over WSS with DTLS-SRTP, dialer, hold/transfer controls   |
| [ ] Real-time system health diagnostics (CPU, RAM, Disk, FreeSWITCH, PostgreSQL, uptime)       |
| [ ] Security center: Toll fraud monitor, rate limiter, SIP attack blocker, and alert log       |
| [ ] Automated backup & restore engine (database dump, telephony configs, SHA-256 checksums)     |
+-------------------------------------------------------------------------------------------------+
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
| PHASE 6: Production Hardening, Systemd Services, Nginx & Deployment Package                     |
| [ ] Systemd service definitions (asterisk, eclypetech-backend, eclypetech-frontend)             |
| [ ] Nginx reverse proxy configuration for HTTPS, WebSockets, and WebRTC WSS                     |
| [ ] Guided installation script (install.sh), upgrade script, backup script, and health check    |
| [ ] Run end-to-end acceptance tests across API, database, UI, and telephony                     |
| [ ] Comprehensive administrator documentation and deployment guide                              |
+-------------------------------------------------------------------------------------------------+
```

---

## Phase Verification Criteria

At the conclusion of each phase:
1. Verify database integrity and migrations.
2. Confirm service health and log outputs without fatal exceptions.
3. Validate telephony engine state through FreeSWITCH CLI (`fs_cli` / ESL).
4. Run automated test scripts.
5. Provide precise CLI commands for reproducible verification.
