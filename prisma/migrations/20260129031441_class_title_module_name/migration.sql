-- Add title to Class and backfill
ALTER TABLE "Class" ADD COLUMN "title" TEXT;
UPDATE "Class" SET "title" = COALESCE("title", "name");
ALTER TABLE "Class" ALTER COLUMN "title" SET NOT NULL;

-- Add name to Module and backfill from previous title
ALTER TABLE "Module" ADD COLUMN "name" TEXT;
UPDATE "Module" SET "name" = COALESCE("name", "title");

-- Move visibleTitle into title for learner-facing display
UPDATE "Module" SET "title" = COALESCE("visibleTitle", "title");

ALTER TABLE "Module" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Module" DROP COLUMN "visibleTitle";
