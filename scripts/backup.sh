#!/usr/bin/env bash
set -e

BACKUP_DIR="/var/backups/eclypetech"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_FILE="${BACKUP_DIR}/eclypetech_backup_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"
TEMP_DIR=$(mktemp -d)

echo "=== ECLYPETECH PBX Automated Disaster Recovery Snapshot ==="
echo "Timestamp: ${TIMESTAMP}"

# 1. PostgreSQL DB Dump
echo "[1/4] Dumping PostgreSQL database..."
PGPASSWORD="EclypeTechDB2026!" pg_dump -h 127.0.0.1 -U eclypetech -d eclypetech_pbx -F c -f "${TEMP_DIR}/database.dump"

# 2. Asterisk Configurations
echo "[2/4] Archiving Asterisk configurations..."
tar -czf "${TEMP_DIR}/asterisk_config.tar.gz" -C /etc/asterisk .

# 3. Application environment & database seeds
echo "[3/4] Archiving system configurations..."
cp /root/pbx/backend/.env "${TEMP_DIR}/backend.env"

# 4. Create master encrypted/compressed archive
echo "[4/4] Generating master tarball..."
tar -czf "${TARGET_FILE}" -C "${TEMP_DIR}" .
rm -rf "${TEMP_DIR}"

CHECKSUM=$(sha256sum "${TARGET_FILE}" | awk '{print $1}')
FILESIZE=$(stat -c%s "${TARGET_FILE}")

echo "Backup complete: ${TARGET_FILE}"
echo "Size: ${FILESIZE} bytes"
echo "SHA-256: ${CHECKSUM}"
echo "=== Snapshot finished successfully ==="
