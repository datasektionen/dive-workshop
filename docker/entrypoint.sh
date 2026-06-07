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

echo "Running migrations..."
if ! run_with_retries "Prisma migrate deploy" 8 3 npx prisma migrate deploy; then
  echo "Migration deploy failed. Current migration status:"
  npx prisma migrate status || true
  exit 1
fi

echo "Checking for existing data..."

count_admins() {
  node -e 'const { PrismaClient } = require("@prisma/client"); const { PrismaPg } = require("@prisma/adapter-pg"); const { Pool } = require("pg"); const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dive" }); const prisma = new PrismaClient({ adapter: new PrismaPg(pool) }); prisma.admin.count().then((count) => { process.stdout.write(String(count)); return prisma.$disconnect(); }).catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1); });' > /tmp/admin_count
}

# Retry the count itself: a transient DB error here must not be mistaken for
# "database already seeded" (which would boot the server with no admin).
if ! run_with_retries "Admin count check" 8 3 count_admins; then
  echo "Unable to determine admin count. Aborting."
  exit 1
fi

ADMIN_COUNT=$(cat /tmp/admin_count)

# Guard against an empty/non-numeric result slipping through.
case "$ADMIN_COUNT" in
  ''|*[!0-9]*)
    echo "Admin count was not a valid number ('$ADMIN_COUNT'). Aborting."
    exit 1
    ;;
esac

if [ "$ADMIN_COUNT" = "0" ]; then
  echo "Database empty. Running seed..."
  if ! run_with_retries "Prisma seed" 3 2 npx prisma db seed; then
    echo "Seed failed after retries."
    exit 1
  fi
else
  echo "Database already seeded. Skipping."
fi

exec node server.mjs
