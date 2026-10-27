#!/usr/bin/env bash
set -euo pipefail

# Dumps the Quantora Postgres database to ./backups/quantora-YYYYMMDD-HHMMSS.sql
# Requires: docker compose, running quantora-postgres (or set COMPOSE_FILE / service name).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${ROOT}/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/quantora-${STAMP}.sql"

mkdir -p "${BACKUP_DIR}"

cd "${ROOT}"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-quantora}" > "${OUT}"

echo "Backup written to ${OUT}"
