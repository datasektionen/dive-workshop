-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- Add columns
ALTER TABLE "Session" ADD COLUMN "participantId" TEXT;
ALTER TABLE "ParticipantEvent" ADD COLUMN "participantId" TEXT;
ALTER TABLE "ParticipantProgress" ADD COLUMN "participantId" TEXT;
ALTER TABLE "ParticipantCode" ADD COLUMN "participantId" TEXT;

-- Populate Participant from existing participant sessions
INSERT INTO "Participant" ("id", "classId", "name", "code", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       "classId",
       COALESCE("name", 'Participant'),
       "participantCode",
       COALESCE("createdAt", NOW()),
       NOW()
FROM "Session"
WHERE "type" = 'participant' AND "participantCode" IS NOT NULL;

-- Link sessions to participants via code + class
UPDATE "Session" s
SET "participantId" = p."id"
FROM "Participant" p
WHERE s."type" = 'participant'
  AND s."participantCode" IS NOT NULL
  AND p."code" = s."participantCode"
  AND p."classId" = s."classId";

-- Backfill participantId on related tables
UPDATE "ParticipantEvent" e
SET "participantId" = s."participantId"
FROM "Session" s
WHERE e."sessionId" = s."id";

UPDATE "ParticipantProgress" p
SET "participantId" = s."participantId"
FROM "Session" s
WHERE p."sessionId" = s."id";

UPDATE "ParticipantCode" c
SET "participantId" = s."participantId"
FROM "Session" s
WHERE c."sessionId" = s."id";

-- Indexes & constraints
CREATE UNIQUE INDEX "Participant_code_key" ON "Participant"("code");

-- Drop old participant code index/column
DROP INDEX IF EXISTS "Session_participantCode_key";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "participantCode";

-- Foreign keys
ALTER TABLE "Session" ADD CONSTRAINT "Session_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Participant" ADD CONSTRAINT "Participant_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipantEvent" ADD CONSTRAINT "ParticipantEvent_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantProgress" ADD CONSTRAINT "ParticipantProgress_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantCode" ADD CONSTRAINT "ParticipantCode_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
