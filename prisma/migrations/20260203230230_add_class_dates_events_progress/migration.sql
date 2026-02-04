-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ParticipantEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "moduleId" TEXT,
    "blockId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantProgress" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "moduleId" TEXT,
    "blockId" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ParticipantProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParticipantEvent_classId_createdAt_idx" ON "ParticipantEvent"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipantEvent_sessionId_createdAt_idx" ON "ParticipantEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipantProgress_classId_idx" ON "ParticipantProgress"("classId");

-- CreateIndex
CREATE INDEX "ParticipantProgress_sessionId_idx" ON "ParticipantProgress"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProgress_sessionId_blockId_key" ON "ParticipantProgress"("sessionId", "blockId");

-- AddForeignKey
ALTER TABLE "ParticipantEvent" ADD CONSTRAINT "ParticipantEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantEvent" ADD CONSTRAINT "ParticipantEvent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantEvent" ADD CONSTRAINT "ParticipantEvent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantEvent" ADD CONSTRAINT "ParticipantEvent_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProgress" ADD CONSTRAINT "ParticipantProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProgress" ADD CONSTRAINT "ParticipantProgress_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProgress" ADD CONSTRAINT "ParticipantProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProgress" ADD CONSTRAINT "ParticipantProgress_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
