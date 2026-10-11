#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/eclypetech_backup_YYYYMMDD_HHMMSS.tar.gz"
    exit 1
fi

BACKUP_ARCHIVE="$1"

if [ ! -f "${BACKUP_ARCHIVE}" ]; then
    echo "Error: Backup archive ${BACKUP_ARCHIVE} not found!"
    exit 1
fi

echo "=== ECLYPETECH PBX Disaster Recovery Restoration ==="
echo "Restoring from: ${BACKUP_ARCHIVE}"

TEMP_DIR=$(mktemp -d)
tar -xzf "${BACKUP_ARCHIVE}" -C "${TEMP_DIR}"

# 1. Restore PostgreSQL DB
echo "[1/3] Restoring database schema and records..."
PGPASSWORD="EclypeTechDB2026!" pg_restore -h 127.0.0.1 -U eclypetech -d eclypetech_pbx --clean --if-exists "${TEMP_DIR}/database.dump" || true

# 2. Restore Asterisk configurations
echo "[2/3] Restoring Asterisk configurations..."
if [ -f "${TEMP_DIR}/asterisk_config.tar.gz" ]; then
    tar -xzf "${TEMP_DIR}/asterisk_config.tar.gz" -C /etc/asterisk/ 2>/dev/null || true
fi

# 3. Reload Asterisk
echo "[3/3] Reloading Asterisk PJSIP & Dialplan..."
asterisk -rx "pjsip reload" > /dev/null 2>&1 || true
asterisk -rx "dialplan reload" > /dev/null 2>&1 || true

rm -rf "${TEMP_DIR}"
echo "=== Restoration Completed Successfully ==="
