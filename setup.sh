#!/usr/bin/env bash
# ==============================================================================
# ECLYPETECH PBX - Enterprise System Deployment & Dependency Installer
# Platform: Ubuntu Server 22.04 / 24.04 / 26.04 LTS & Debian
# Telephony Engine: Asterisk 22 LTS (PJSIP / AMI / WebRTC)
# Database: PostgreSQL 16+
# Runtime: Node.js 20+ LTS / TypeScript / Next.js
# ==============================================================================

set -euo pipefail

# Visual formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}"
echo "=================================================================="
echo "    ECLYPETECH PBX - Enterprise Production Deployment Script"
echo "=================================================================="
echo -e "${NC}"

# ------------------------------------------------------------------------------
# 0. Root Check & Environment Discovery
# ------------------------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This setup script must be run as root. Use: sudo ./setup.sh${NC}"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PBX_ROOT="${SCRIPT_DIR}"

# Detect or accept Server Public/Primary IP
SERVER_IP="${SERVER_IP:-${1:-}}"
if [ -z "${SERVER_IP}" ]; then
    SERVER_IP=$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || curl -s --max-time 3 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
fi
SERVER_IP="${SERVER_IP:-127.0.0.1}"

echo -e "Project Directory : ${BOLD}${PBX_ROOT}${NC}"
echo -e "Server Primary IP : ${BOLD}${SERVER_IP}${NC}"
echo ""

export DEBIAN_FRONTEND=noninteractive

# ------------------------------------------------------------------------------
# 1. System Package Repositories & Base Dependencies
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[1/9] Installing system prerequisites and base toolchain...${NC}"
apt-get update -y -q

apt-get install -y -q \
    ca-certificates \
    curl \
    wget \
    gnupg \
    git \
    net-tools \
    netcat-openbsd \
    openssl \
    sudo \
    build-essential \
    sox \
    psmisc

# Ensure Node.js 20+ LTS is installed
NODE_INSTALLED=false
if command -v node >/dev/null 2>&1; then
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
    if [ "${NODE_MAJOR}" -ge 20 ]; then
        NODE_INSTALLED=true
        echo -e "  -> Node.js ${BOLD}$(node -v)${NC} is already installed."
    fi
fi

if [ "${NODE_INSTALLED}" = "false" ]; then
    echo -e "  -> Installing Node.js 22 LTS via NodeSource..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
    apt-get update -y -q
    apt-get install -y -q nodejs
    echo -e "  -> Installed Node.js ${BOLD}$(node -v)${NC} & npm ${BOLD}$(npm -v)${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Database & Web Server Installation
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[2/9] Installing PostgreSQL and Nginx...${NC}"
apt-get install -y -q postgresql postgresql-contrib nginx

systemctl enable postgresql
systemctl start postgresql

# ------------------------------------------------------------------------------
# 3. Asterisk 22 LTS Telephony Engine Installation
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[3/9] Installing Asterisk 22 LTS and audio codecs...${NC}"
apt-get install -y -q asterisk asterisk-modules asterisk-config

# Install core sound prompts (fallback order: wav -> gsm -> default)
apt-get install -y -q asterisk-core-sounds-en-wav 2>/dev/null || \
apt-get install -y -q asterisk-core-sounds-en-gsm 2>/dev/null || \
apt-get install -y -q asterisk-core-sounds-en 2>/dev/null || true

# Optional testing tools
apt-get install -y -q sngrep sip-tester 2>/dev/null || true

# ------------------------------------------------------------------------------
# 4. Directory Structure & Permissions Setup
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[4/9] Preparing runtime directories and permissions...${NC}"
mkdir -p /var/recordings/pbx
mkdir -p /var/backups/eclypetech
mkdir -p /var/spool/asterisk/monitor
mkdir -p /etc/asterisk/keys
mkdir -p /etc/asterisk/manager.d
mkdir -p "${PBX_ROOT}/telephony/recordings"
mkdir -p "${PBX_ROOT}/telephony/sounds"

# Asterisk permissions
chown -R asterisk:asterisk /var/spool/asterisk /var/lib/asterisk /var/log/asterisk
chmod -R 775 /var/recordings/pbx
chmod -R 755 /var/backups/eclypetech

# ------------------------------------------------------------------------------
# 5. Database Configuration & Schema Migration
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[5/9] Configuring PostgreSQL database and credentials...${NC}"

# Wait for PostgreSQL daemon to accept queries
until sudo -u postgres psql -c '\q' 2>/dev/null; do
    echo "  Waiting for PostgreSQL service to become ready..."
    sleep 1
done

# Create user 'eclypetech' with password 'EclypeTechDB2026!'
sudo -u postgres psql -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eclypetech') THEN
    CREATE ROLE eclypetech WITH LOGIN SUPERUSER PASSWORD 'EclypeTechDB2026!';
  ELSE
    ALTER ROLE eclypetech WITH PASSWORD 'EclypeTechDB2026!';
  END IF;
END
\$\$;"

# Create database 'eclypetech_pbx' if not exists
DB_EXISTS=$(sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'eclypetech_pbx'" | grep -q 1 && echo "yes" || echo "no")
if [ "${DB_EXISTS}" = "no" ]; then
    echo "  Creating eclypetech_pbx database..."
    sudo -u postgres psql -c "CREATE DATABASE eclypetech_pbx OWNER eclypetech;"
fi
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eclypetech_pbx TO eclypetech;"

# ------------------------------------------------------------------------------
# 6. Asterisk Telephony Engine Configuration
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[6/9] Deploying Asterisk PJSIP & AMI configurations...${NC}"

# Copy Asterisk configuration templates
if [ -d "${PBX_ROOT}/deploy/asterisk" ]; then
    cp -r "${PBX_ROOT}/deploy/asterisk/"* /etc/asterisk/
elif [ -d "${PBX_ROOT}/telephony/conf" ]; then
    cp -r "${PBX_ROOT}/telephony/conf/"* /etc/asterisk/
fi

# Ensure manager user configuration exists
mkdir -p /etc/asterisk/manager.d
if [ -f "${PBX_ROOT}/deploy/asterisk/manager.d/eclype.conf" ]; then
    cp "${PBX_ROOT}/deploy/asterisk/manager.d/eclype.conf" /etc/asterisk/manager.d/eclype.conf
fi

# Update external signaling and media IPs in pjsip.transports.conf
if [ -f /etc/asterisk/pjsip.transports.conf ]; then
    sed -i "s/external_media_address=.*/external_media_address=${SERVER_IP}/g" /etc/asterisk/pjsip.transports.conf
    sed -i "s/external_signaling_address=.*/external_signaling_address=${SERVER_IP}/g" /etc/asterisk/pjsip.transports.conf
fi

# Generate TLS certificates for Asterisk WebRTC WSS (port 8089 / 5066)
if [ ! -f /etc/asterisk/keys/asterisk.crt ] || [ ! -f /etc/asterisk/keys/asterisk.key ]; then
    echo "  Generating WebRTC self-signed TLS certificates in /etc/asterisk/keys..."
    openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
        -subj "/C=US/ST=CA/L=SanFrancisco/O=EclypeTechnology/CN=eclype-pbx.local" \
        -keyout /etc/asterisk/keys/asterisk.key -out /etc/asterisk/keys/asterisk.crt
fi

# Apply strict Asterisk permissions
chown -R asterisk:asterisk /etc/asterisk
chmod 750 /etc/asterisk
chmod 640 /etc/asterisk/*.conf 2>/dev/null || true
chmod 640 /etc/asterisk/manager.d/*.conf 2>/dev/null || true
chmod 600 /etc/asterisk/keys/asterisk.key 2>/dev/null || true
chmod 644 /etc/asterisk/keys/asterisk.crt 2>/dev/null || true

# Enable and restart Asterisk
systemctl enable asterisk
systemctl restart asterisk

# Wait for Asterisk AMI socket (port 5038)
echo "  Verifying Asterisk AMI socket availability..."
for i in {1..15}; do
    if nc -z 127.0.0.1 5038 2>/dev/null; then
        echo -e "  -> Asterisk AMI is ready on port 5038."
        break
    fi
    sleep 1
done

# ------------------------------------------------------------------------------
# 7. Backend & Frontend Build & Provisioning
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[7/9] Setting up and compiling Backend & Frontend applications...${NC}"

# Backend environment file
if [ ! -f "${PBX_ROOT}/backend/.env" ]; then
    if [ -f "${PBX_ROOT}/backend/.env.example" ]; then
        cp "${PBX_ROOT}/backend/.env.example" "${PBX_ROOT}/backend/.env"
    fi
fi
if [ -f "${PBX_ROOT}/backend/.env" ]; then
    sed -i "s/^PBX_DOMAIN=.*/PBX_DOMAIN=\"${SERVER_IP}\"/g" "${PBX_ROOT}/backend/.env"
fi

# Compile Backend
echo "  [Backend] Installing Node packages..."
cd "${PBX_ROOT}/backend"
npm install --no-audit

echo "  [Backend] Running Prisma migrations & client generation..."
npx prisma generate
npx prisma migrate deploy

# Seed Database if empty
EXT_COUNT=$(PGPASSWORD="EclypeTechDB2026!" psql -h 127.0.0.1 -U eclypetech -d eclypetech_pbx -t -c 'SELECT count(*) FROM "Extension";' 2>/dev/null | xargs || echo "0")
if [ "${EXT_COUNT}" = "0" ] || [ -z "${EXT_COUNT}" ]; then
    echo "  [Backend] Database is empty. Seeding initial users, extensions, and defaults..."
    npm run prisma:seed
else
    echo "  [Backend] Existing database detected (${EXT_COUNT} extensions registered)."
fi

echo "  [Backend] Compiling TypeScript application..."
npm run build

# Compile Frontend
echo "  [Frontend] Installing Node packages..."
cd "${PBX_ROOT}/frontend"
npm install --no-audit

echo "  [Frontend] Building Next.js production bundle..."
npm run build

# ------------------------------------------------------------------------------
# 8. Nginx Reverse Proxy Configuration
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[8/9] Configuring Nginx reverse proxy...${NC}"

if [ -f "${PBX_ROOT}/deploy/nginx/eclypetech-pbx.conf" ]; then
    cp "${PBX_ROOT}/deploy/nginx/eclypetech-pbx.conf" /etc/nginx/sites-available/eclypetech-pbx.conf
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    # Symlink eclypetech site
    ln -sf /etc/nginx/sites-available/eclypetech-pbx.conf /etc/nginx/sites-enabled/eclypetech-pbx.conf
    nginx -t
    systemctl enable nginx
    systemctl reload nginx || systemctl restart nginx
fi

# Configure UFW if enabled
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
    echo "  Configuring UFW firewall rules for PBX ports..."
    ufw allow 22/tcp comment 'SSH' || true
    ufw allow 80/tcp comment 'HTTP PBX Web Console' || true
    ufw allow 443/tcp comment 'HTTPS PBX Web Console' || true
    ufw allow 5060/udp comment 'SIP UDP' || true
    ufw allow 5060/tcp comment 'SIP TCP' || true
    ufw allow 5066/tcp comment 'WebRTC WSS Proxy' || true
    ufw allow 8088/tcp comment 'Asterisk HTTP/WS' || true
    ufw allow 8089/tcp comment 'Asterisk WSS' || true
    ufw allow 10000:20000/udp comment 'Asterisk RTP Media' || true
fi

# ------------------------------------------------------------------------------
# 9. Systemd Services Installation & Start
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[9/9] Installing and starting systemd services...${NC}"

NODE_BIN=$(which node || echo "/usr/bin/node")
NPM_BIN=$(which npm || echo "/usr/bin/npm")

# Render backend service unit
sed -e "s|WorkingDirectory=.*|WorkingDirectory=${PBX_ROOT}/backend|g" \
    -e "s|ExecStart=.*|ExecStart=${NODE_BIN} ${PBX_ROOT}/backend/dist/server.js|g" \
    -e "s|EnvironmentFile=-.*|EnvironmentFile=-${PBX_ROOT}/backend/.env|g" \
    "${PBX_ROOT}/deploy/systemd/eclypetech-backend.service" > /etc/systemd/system/eclypetech-backend.service

# Render frontend service unit
sed -e "s|WorkingDirectory=.*|WorkingDirectory=${PBX_ROOT}/frontend|g" \
    -e "s|ExecStart=.*|ExecStart=${NPM_BIN} start|g" \
    "${PBX_ROOT}/deploy/systemd/eclypetech-frontend.service" > /etc/systemd/system/eclypetech-frontend.service

systemctl daemon-reload

systemctl enable eclypetech-backend.service
systemctl enable eclypetech-frontend.service

systemctl restart eclypetech-backend.service
systemctl restart eclypetech-frontend.service

# Wait for backend and frontend to initialize
echo "  Waiting for backend and frontend ports to become active..."
sleep 3

# ------------------------------------------------------------------------------
# Diagnostics & Health Verification
# ------------------------------------------------------------------------------
echo ""
echo -e "${BLUE}${BOLD}==================================================================${NC}"
echo -e "${BLUE}${BOLD}    Running Final Diagnostics & Health Verification               ${NC}"
echo -e "${BLUE}${BOLD}==================================================================${NC}"

if [ -f "${PBX_ROOT}/scripts/healthcheck.sh" ]; then
    bash "${PBX_ROOT}/scripts/healthcheck.sh" || true
fi

echo ""
echo -e "${GREEN}${BOLD}==================================================================${NC}"
echo -e "${GREEN}${BOLD}    ECLYPETECH PBX DEPLOYMENT COMPLETED SUCCESSFULLY!             ${NC}"
echo -e "${GREEN}${BOLD}==================================================================${NC}"
echo -e "Web Management Console : ${BOLD}http://${SERVER_IP}/${NC}"
echo -e "Backend REST API       : ${BOLD}http://${SERVER_IP}/api/health${NC}"
echo -e "WebRTC SIP Signaling   : ${BOLD}ws://${SERVER_IP}:5066/ws${NC}"
echo -e "SIP Hardphone Port     : ${BOLD}${SERVER_IP}:5060 (UDP/TCP)${NC}"
echo ""
echo -e "${BOLD}Default Super Admin Credentials:${NC}"
echo -e "Username: ${BOLD}admin${NC}"
echo -e "Password: ${BOLD}Admin@EclypeTech2026!${NC}"
echo ""
echo -e "${BOLD}Pre-configured Sample Extensions:${NC}"
echo -e "Ext 1001: Alice Smith  (Secret: EclypeExt1001!)"
echo -e "Ext 1002: Bob Jones    (Secret: EclypeExt1002!)"
echo -e "Ext 1003: Sales Agent  (Secret: EclypeExt1003!)"
echo "=================================================================="
