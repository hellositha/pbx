# Eclype Tech PBX - System Architecture Document

**Product Name:** Eclype Tech PBX  
**Developer / Brand:** Eclype Tech  
**Deployment Target:** On-Premises Ubuntu Server (Physical Server or VMware VM)  
**System Version:** 1.0.0 Enterprise  

---

## 1. High-Level Architecture Overview

Eclype Tech PBX provides an enterprise-grade, on-premises Unified Communications and Private Branch Exchange platform. The system is architected as decoupled, production-grade subsystems:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +--------------------------------+          +---------------------------------+  |
|  |     SIP Hardphones / ATAs      |          |    Web Browser Administration   |  |
|  |  (Yealink, Grandstream, Cisco) |          |        & WebRTC Softphone       |  |
|  +----------------+---------------+          +----------------+----------------+  |
+-------------------|-------------------------------------------|-------------------+
                    | SIP (UDP/TCP: 5060)                       | HTTPS / WSS (443)
                    | RTP (UDP: 16384-32768)                    |
+-------------------|-------------------------------------------|-------------------+
|                   v                                           v                   |
|  +--------------------------------+          +---------------------------------+  |
|  |       SIP Signaling (5060)     |          |       Nginx Reverse Proxy       |  |
|  |       RTP Media Gateway        |          |    - TLS 1.3 Termination        |  |
|  |       WebRTC WSS (5066/7443)   |          |    - Static Next.js Assets      |  |
|  |       FreeSWITCH Core 1.11.x   |          |    - REST API (/api)            |  |
|  |                                |          |    - WebSocket (/ws)            |  |
|  +----------------+---------------+          +----------------+----------------+  |
|                   |                                           |                   |
|                   | Local ESL (127.0.0.1:8021)                | HTTP / WS         |
|                   +-------------------+   +-------------------+                   |
|                                       |   |                                       |
|                                       v   v                                       |
|                         +-----------------------------------+                     |
|                         |      PBX Backend API Server       |                     |
|                         |    (Node.js / Express / TS)       |                     |
|                         |   - Telephony ESL Service         |                     |
|                         |   - Extension & Trunk Provisioner |                     |
|                         |   - Inbound / Outbound Router     |                     |
|                         |   - WebSocket Event Dispatcher    |                     |
|                         |   - Security & Toll Fraud Engine  |                     |
|                         |   - Background Jobs & Retries     |                     |
|                         +-----------------+-----------------+                     |
|                                           |                                       |
|                                           | Prisma ORM (Port 5432)                |
|                                           v                                       |
|                         +-----------------------------------+                     |
|                         |      PostgreSQL 18 Database       |                     |
|                         |   - Configuration State           |                     |
|                         |   - CDR Call Detail Records       |                     |
|                         |   - Users, Roles, Audit Logs      |                     |
|                         |   - Recordings Metadata           |                     |
|                         +-----------------------------------+                     |
|                                                                                   |
|                         +-----------------------------------+                     |
|                         |      Local Storage Subsystem      |                     |
|                         |   - /var/recordings/pbx/ (Audio)  |                     |
|                         |   - /var/backups/pbx/ (Encrypted) |                     |
|                         +-----------------------------------+                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 VoIP Telephony Engine (FreeSWITCH)
* **Version:** FreeSWITCH 1.11.x
* **Signaling:** Sofia-SIP (`mod_sofia`) handling SIP profiles:
  * `internal`: SIP endpoint registrations on port 5060 (UDP/TCP), WebRTC WSS on port 5066/7443.
  * `external`: SIP trunk provider gateways and DID ingress on port 5080.
* **Control Interface:** Event Socket Library (`mod_event_socket`) listening **exclusively on `127.0.0.1:8021`**. External access is strictly blocked by local binding and firewall rules.
* **Media Handling:** Direct RTP bridging, audio transcoders (`mod_opus`, `mod_spandsp`, `mod_sndfile`), DTLS-SRTP for WebRTC media streams.
* **Call Control Applications:** `mod_callcenter` for ACD queues, `mod_conference` for meet-me conferencing, `mod_voicemail` for mailboxes, `mod_valet_parking` for call parking, and `mod_dptools` for IVR execution.

### 2.2 PBX Backend API & Real-time Server
* **Runtime:** Node.js 22 LTS with TypeScript.
* **Framework:** Express with TypeScript, Prisma ORM, and WebSocket (`ws`).
* **Telephony Integration:** ESL client communicating over localhost TCP socket:
  * Subscribes to events: `CHANNEL_CREATE`, `CHANNEL_ANSWER`, `CHANNEL_HANGUP`, `CUSTOM sofia::register`, `CUSTOM sofia::unregister`, `RECORD_START`, `RECORD_STOP`.
  * Issues control commands: `originate`, `uuid_kill`, `uuid_hold`, `uuid_transfer`, `uuid_record`, `reloadxml`.
* **Configuration Provisioning:** Synchronizes database changes into FreeSWITCH directory, dialplan, and profile XML files with atomic write, backup, syntax verification, and `reloadxml` triggering.
* **Background Services:**
  * Trunk ping and registration heartbeat monitor.
  * CDR reconciliation and queue stats aggregator.
  * Recording retention and storage enforcement worker.
  * Scheduled encrypted database & configuration backup worker.

### 2.3 Management Interface (Frontend)
* **Framework:** Next.js 14/15 App Router, React 18/19, TypeScript, Tailwind CSS, Lucide icons, shadcn/ui component primitives.
* **Theme & UX:** Enterprise dark navy styling, responsive layouts, data tables with live filtering, real-time status badges, interactive dialogs, audio playback widgets.
* **Real-time Synchronization:** Client WebSocket connection receiving live call updates, extension presence, queue telemetry, and system resource alerts without client polling.
* **Integrated Softphone:** WebRTC softphone built on SIP.js connecting via WSS to FreeSWITCH for zero-install browser telephony with DTMF, hold, transfer, and audio device selection.

### 2.4 Database Subsystem (PostgreSQL)
* **Engine:** PostgreSQL 18 with relational integrity, foreign key constraints, indexes, and transactional boundaries.
* **Role:** Stores all user identities, RBAC permissions, extension configurations, trunk settings, routing trees, IVR menus, ACD queues, voicemail metadata, call records (CDR), audit logs, and security events.

### 2.5 Security, Firewall & Reverse Proxy
* **Nginx:** Handles HTTPS (TLS 1.3) termination, serves static frontend assets, reverse proxies `/api` and `/ws` to the backend, and securely passes WebRTC WSS signaling.
* **UFW Firewall:** Default deny inbound; permits only SSH (22), HTTP (80), HTTPS (443), SIP (5060, 5080), WSS (5066/7443), and RTP media ports (16384-32768).
* **Fail2ban:** Jails for repeated SIP REGISTER failures, bad authentication attempts, and API rate-limit abuse.
* **Toll Fraud Prevention:** Outbound call route matching with destination category tags (Internal, Local, Domestic, International, Premium), spend thresholds, caller ID verification, and per-extension dial class restrictions.
