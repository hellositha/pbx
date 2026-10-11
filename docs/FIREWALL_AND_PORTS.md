# Eclype Technology PBX - Firewall, Ports & Network Security Specification

This document provides the network port matrix, UFW firewall configurations, and Fail2ban integration rules for **Eclype Technology PBX**.

---

## 1. Network Port Matrix

| Port | Protocol | Scope / Direction | Default Access | Service | Purpose |
|---|---|---|---|---|---|
| **22** | TCP | Inbound | Authorized Admins | OpenSSH | Secure Host Administration |
| **80** | TCP | Inbound | Public / LAN | Nginx HTTP | HTTP -> HTTPS Redirect / ACME |
| **443** | TCP | Inbound | Public / LAN | Nginx HTTPS | PBX Management Web UI & REST API |
| **5060** | UDP + TCP | Inbound | Public / LAN / Phones | FreeSWITCH Sofia `internal` | SIP Endpoint Registration & Signaling |
| **5066** | TCP | Inbound | Public / LAN / Browsers | FreeSWITCH Sofia WSS | WebRTC SIP Signaling (WebSocket Secure) |
| **5080** | UDP + TCP | Inbound | Trusted SIP Providers | FreeSWITCH Sofia `external` | SIP Trunk Egress & Inbound DID Ingress |
| **7443** | TCP | Inbound | Public / LAN / Browsers | FreeSWITCH Sofia TLS | Alternative WebRTC WSS / TLS Signaling |
| **16384–32768** | UDP | Inbound | Public / LAN / Phones | FreeSWITCH Core | RTP Audio & Video Media Transport |
| **5432** | TCP | **Localhost Only** | `127.0.0.1` | PostgreSQL 18 | PBX Configuration & CDR Database |
| **8021** | TCP | **Localhost Only** | `127.0.0.1` | FreeSWITCH ESL | Event Socket Library API Control |
| **4000** | TCP | **Localhost Only** | `127.0.0.1` | Node.js Backend API | Express REST API & WebSocket |
| **3000** | TCP | **Localhost Only** | `127.0.0.1` | Next.js Frontend | Next.js Web Application Server |

> [!CAUTION]
> **Strict Isolation Warning:** Port `8021` (FreeSWITCH Event Socket) and Port `5432` (PostgreSQL) must **NEVER** be bound to `0.0.0.0` or permitted through the external firewall. They are restricted exclusively to `127.0.0.1`.

---

## 2. UFW Firewall Configuration Guide

To configure UFW safely on Ubuntu without interrupting active SSH sessions:

```bash
# 1. Ensure default policies: drop inbound, permit outbound
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Allow SSH administration immediately to prevent lockout
sudo ufw allow 22/tcp comment "SSH Remote Management"

# 3. Allow Web UI & REST API
sudo ufw allow 80/tcp comment "HTTP (Redirect to HTTPS)"
sudo ufw allow 443/tcp comment "HTTPS Web Administration"

# 4. Allow SIP Signaling for Extensions & Softphones
sudo ufw allow 5060/udp comment "SIP Internal UDP Signaling"
sudo ufw allow 5060/tcp comment "SIP Internal TCP Signaling"

# 5. Allow WebRTC WSS Signaling
sudo ufw allow 5066/tcp comment "WebRTC WSS SIP Signaling"
sudo ufw allow 7443/tcp comment "WebRTC TLS SIP Signaling"

# 6. Allow SIP Trunk Provider Ingress (can be restricted to provider IP ranges)
sudo ufw allow 5080/udp comment "SIP Trunk External Gateway"
sudo ufw allow 5080/tcp comment "SIP Trunk External Gateway"

# 7. Allow RTP Media Audio Streams
sudo ufw allow 16384:32768/udp comment "FreeSWITCH RTP Audio/Video Streams"

# 8. Enable UFW
sudo ufw enable
sudo ufw status verbose
```

---

## 3. Fail2ban Intrusion Prevention Rules

Fail2ban monitors FreeSWITCH application logs (`/var/log/freeswitch/freeswitch.log`) and blocks malicious IPs generating brute-force SIP registration errors or repeated authentication failures.

### Filter Definition (`/etc/fail2ban/filter.d/freeswitch.conf`)
```ini
[Definition]
failregex = \[WARNING\] sofia_reg\.c:\d+ SIP auth failure \((REGISTER|INVITE)\) on profile \'[^\']*\' for \[.*\] from ip <HOST>
            \[WARNING\] sofia_reg\.c:\d+ Can\'t find user \[[^\]]*\] from <HOST>
            \[WARNING\] sofia\.c:\d+ IP <HOST> Rejected by [a-zA-Z0-9_-]+ acl
ignoreregex =
```

### Jail Definition (`/etc/fail2ban/jail.d/freeswitch.local`)
```ini
[freeswitch]
enabled  = true
port     = 5060,5066,5080
protocol = all
filter   = freeswitch
logpath  = /var/log/freeswitch/freeswitch.log
maxretry = 5
findtime = 600
bantime  = 86400
```
