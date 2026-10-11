# ECLYPETECH PBX - Enterprise IP PBX & Unified Communications Platform

Enterprise-grade on-premises IP PBX solution powered by Asterisk 22 LTS, Node.js REST API with WebSocket event stream, Next.js administrative console with integrated WebRTC softphone, and PostgreSQL database.

---

## 🚀 Quick Start Deployment on a New Server

To install all dependencies, configure databases, set up Asterisk, build backend/frontend, and start all services on a clean Ubuntu/Debian server:

```bash
git clone <repository-url> /root/pbx
cd /root/pbx
sudo chmod +x setup.sh
sudo ./setup.sh
```

You can optionally specify a custom server IP address:
```bash
sudo ./setup.sh <SERVER_IP>
# Or via environment variable:
sudo SERVER_IP=192.168.1.100 ./setup.sh
```

---

## 📦 What `setup.sh` Automatically Installs & Configures

1. **System Prerequisites**: `curl`, `wget`, `git`, `net-tools`, `netcat`, `openssl`, `sox`, `build-essential`.
2. **Node.js LTS (v20/v22)**: Installed via NodeSource if missing or outdated.
3. **Database (PostgreSQL)**:
   - Starts and enables PostgreSQL service.
   - Creates database user `eclypetech` and database `eclypetech_pbx`.
4. **Telephony Engine (Asterisk 22 LTS)**:
   - Installs `asterisk`, `asterisk-modules`, `asterisk-config`, and core audio prompts.
   - Provisions PJSIP transports, endpoints, trunks, voicemail, and dialplans from `deploy/asterisk/`.
   - Generates DTLS/WSS self-signed SSL certificates for WebRTC softphones.
   - Configures Asterisk Manager Interface (AMI) on `127.0.0.1:5038`.
   - Configures WebRTC HTTP/WebSocket engine on port `8088`.
5. **Backend Application**:
   - Generates `.env` from template.
   - Installs npm dependencies.
   - Generates Prisma client and executes database migrations (`prisma migrate deploy`).
   - Seeds initial administrator users, departments, and sample extensions.
   - Compiles TypeScript into `dist/`.
6. **Frontend Application**:
   - Installs npm dependencies.
   - Compiles production Next.js build.
7. **Nginx Reverse Proxy**:
   - Deploys `deploy/nginx/eclypetech-pbx.conf`.
   - Serves frontend on port `80`.
   - Proxies `/api/` and `/ws` to the backend on `127.0.0.1:4000`.
   - Proxies WebRTC WSS on port `5066` and `/ws-sip` to Asterisk on `127.0.0.1:8088`.
8. **Systemd Services**:
   - Installs and enables `eclypetech-backend.service` and `eclypetech-frontend.service`.
   - Restarts all services cleanly.
9. **Firewall (UFW)**: Opens required ports if UFW is active.
10. **Diagnostics**: Executes `scripts/healthcheck.sh` verifying all subsystems.

---

## 🛠 Service Management Commands

```bash
# Check service statuses
systemctl status eclypetech-backend.service
systemctl status eclypetech-frontend.service
systemctl status asterisk.service
systemctl status nginx.service
systemctl status postgresql.service

# Restart services
sudo systemctl restart eclypetech-backend.service
sudo systemctl restart eclypetech-frontend.service
sudo systemctl restart asterisk.service
sudo systemctl restart nginx.service

# View real-time logs
journalctl -u eclypetech-backend.service -f
journalctl -u eclypetech-frontend.service -f
journalctl -u asterisk.service -f

# Run comprehensive system diagnostics
/root/pbx/scripts/healthcheck.sh
```

---

## 🔑 Default Credentials & Access

- **Web Management Console:** `http://<SERVER_IP>/`
- **Default Super Admin:**
  - **Username:** `admin`
  - **Password:** `Admin@EclypeTech2026!`
- **Pre-configured Extensions:**
  - **1001:** Alice Smith (`EclypeExt1001!`)
  - **1002:** Bob Jones (`EclypeExt1002!`)
  - **1003:** Sales Agent (`EclypeExt1003!`)
# pbx
