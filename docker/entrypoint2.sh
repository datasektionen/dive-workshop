#!/bin/sh
set -e

run_with_retries() {
  description="$1"
  retries="$2"
  delay_seconds="$3"
  shift 3

  attempt=1
  while [ "$attempt" -le "$retries" ]; do
    if "$@"; then
      return 0
    fi

    if [ "$attempt" -eq "$retries" ]; then
      echo "$description failed after $attempt attempts."
      return 1
    fi

    echo "$description failed (attempt $attempt/$retries). Retrying in ${delay_seconds}s..."
    attempt=$((attempt + 1))
    sleep "$delay_seconds"
  done

  return 1
}

DATABASE_URL_VALUE="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/dive}"
BACKUP_DIR="${DB_BACKUP_DIR:-/app/backups}"
BACKUP_FORMAT="${DB_BACKUP_FORMAT:-custom}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found in image. Install postgresql-client first."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

DB_NAME=$(
  DATABASE_URL="$DATABASE_URL_VALUE" node -e '
    try {
      const url = new URL(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dive")
      const dbName = (url.pathname || "/dive").replace(/^\//, "") || "dive"
      process.stdout.write(dbName)
    } catch {
      process.stdout.write("dive")
    }
  '
)

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

if [ "$BACKUP_FORMAT" = "plain" ]; then
  BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
fi

echo "Creating backup at $BACKUP_FILE ..."
if [ "$BACKUP_FORMAT" = "plain" ]; then
  run_with_retries "pg_dump (plain)" 3 2 pg_dump "$DATABASE_URL_VALUE" -f "$BACKUP_FILE"
else
  run_with_retries "pg_dump (custom)" 3 2 pg_dump "$DATABASE_URL_VALUE" -Fc -f "$BACKUP_FILE"
fi

echo "Backup complete."

if [ "${ENTRYPOINT2_DRY_RUN:-0}" = "1" ]; then
  echo "ENTRYPOINT2_DRY_RUN=1 set. Skipping schema reset."
  exit 0
fi

echo "Dropping and recreating schema public (hard reset, includes Prisma metadata tables)..."
if ! run_with_retries "Postgres schema reset" 3 3 node -e '
  const { Client } = require("pg")

  async function main() {
    const client = new Client({
      connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dive",
    })

    await client.connect()
    try {
      await client.query("DROP SCHEMA IF EXISTS public CASCADE;")
      await client.query("CREATE SCHEMA public;")
      await client.query("GRANT ALL ON SCHEMA public TO public;")
    } finally {
      await client.end()
    }
  }

  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
'; then
  echo "Schema reset failed."
  exit 1
fi

echo "Reset flow complete. You can now run docker/entrypoint.sh."
