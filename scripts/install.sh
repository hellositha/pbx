#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PBX_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${PBX_ROOT}/setup.sh" ]; then
    exec "${PBX_ROOT}/setup.sh" "$@"
else
    echo "Error: setup.sh not found in ${PBX_ROOT}"
    exit 1
fi
