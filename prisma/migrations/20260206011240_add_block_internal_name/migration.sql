-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- Backfill existing records
UPDATE "Block" SET "name" = "title" WHERE "name" = '';
