#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy

echo "Checking for existing data..."
ADMIN_COUNT=$(node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.admin.count().then((count) => { process.stdout.write(String(count)); return prisma.$disconnect(); }).catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1); });")

if [ "$ADMIN_COUNT" = "0" ]; then
  echo "Database empty. Running seed..."
  npx prisma db seed
else
  echo "Database already seeded. Skipping."
fi

exec node server.mjs
