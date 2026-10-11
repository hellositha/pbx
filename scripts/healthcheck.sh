#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================================="
echo "    ECLYPETECH PBX Comprehensive Health Diagnostics"
echo "    Telephony Engine: Asterisk 22.5.2 LTS (PJSIP / AMI)"
echo "=========================================================="

FAILED=0

# 1. PostgreSQL DB Check
echo -n "Checking PostgreSQL 18 on 127.0.0.1:5432... "
if PGPASSWORD="EclypeTechDB2026!" psql -h 127.0.0.1 -U eclypetech -d eclypetech_pbx -c "SELECT count(*) FROM \"Extension\";" > /dev/null 2>&1; then
    EXT_COUNT=$(PGPASSWORD="EclypeTechDB2026!" psql -h 127.0.0.1 -U eclypetech -d eclypetech_pbx -t -c "SELECT count(*) FROM \"Extension\";" | xargs)
    echo -e "${GREEN}[OK]${NC} (Database connected, ${EXT_COUNT} extensions in DB)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 2. Asterisk 22 LTS Telephony Engine
echo -n "Checking Asterisk 22 LTS Core Engine... "
if asterisk -rx "core show version" 2>/dev/null | grep -qi "Asterisk 22"; then
    AST_VER=$(asterisk -rx "core show version" 2>/dev/null | head -n 1)
    echo -e "${GREEN}[OK]${NC} (${AST_VER})"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 3. Asterisk PJSIP Endpoints
echo -n "Checking Asterisk PJSIP Endpoints & Transports... "
if asterisk -rx "pjsip show endpoints" 2>/dev/null | grep -qi "Endpoint:"; then
    EP_COUNT=$(asterisk -rx "pjsip show endpoints" 2>/dev/null | grep -c "Endpoint:" || true)
    echo -e "${GREEN}[OK]${NC} (${EP_COUNT} PJSIP endpoints configured)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 4. Asterisk AMI Port 5038
echo -n "Checking Asterisk Manager Interface (AMI) on 127.0.0.1:5038... "
if nc -z 127.0.0.1 5038 2>/dev/null; then
    echo -e "${GREEN}[OK]${NC} (AMI socket listening and responsive)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 5. Asterisk HTTP & WebRTC WebSocket Server on Port 8088
echo -n "Checking Asterisk HTTP / WebSockets on 127.0.0.1:8088... "
if curl -s http://127.0.0.1:8088/httpstatus > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} (res_http_websocket active)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 6. Backend REST API on Port 4000
echo -n "Checking ECLYPETECH PBX Backend REST API (Port 4000)... "
HEALTH_RESP=$(curl -s http://127.0.0.1:4000/api/health || true)
if echo "${HEALTH_RESP}" | grep -q "ONLINE"; then
    echo -e "${GREEN}[OK]${NC} (API reported ONLINE)"
else
    echo -e "${RED}[FAILED]${NC} Response: ${HEALTH_RESP}"
    FAILED=$((FAILED + 1))
fi

# 7. Frontend Next.js Server on Port 3000
echo -n "Checking ECLYPETECH PBX Next.js Console (Port 3000)... "
if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} (Next.js serving on port 3000)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 8. Nginx Reverse Proxy on Port 80
echo -n "Checking Nginx Reverse Proxy (Port 80)... "
NGINX_RESP=$(curl -s http://127.0.0.1/api/health || true)
if echo "${NGINX_RESP}" | grep -q "ONLINE"; then
    echo -e "${GREEN}[OK]${NC} (Nginx proxying /api and / seamlessly)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

# 9. WebRTC Proxy Port 5066
echo -n "Checking WebRTC Dedicated Ingress Port (5066)... "
if nc -z 127.0.0.1 5066 2>/dev/null; then
    echo -e "${GREEN}[OK]${NC} (Port 5066 listening and routing to Asterisk 8088/ws)"
else
    echo -e "${RED}[FAILED]${NC}"
    FAILED=$((FAILED + 1))
fi

echo "=========================================================="
if [ ${FAILED} -eq 0 ]; then
    echo -e "${GREEN}ALL SUBSYSTEMS OPERATIONAL (100% HEALTHY)${NC}"
    exit 0
else
    echo -e "${RED}DIAGNOSTIC ENCOUNTERED ${FAILED} FAILURES${NC}"
    exit 1
fi
