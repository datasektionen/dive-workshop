-- CreateTable
CREATE TABLE "ParticipantCode" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParticipantCode_classId_idx" ON "ParticipantCode"("classId");

-- CreateIndex
CREATE INDEX "ParticipantCode_sessionId_idx" ON "ParticipantCode"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantCode_sessionId_blockId_key" ON "ParticipantCode"("sessionId", "blockId");

-- AddForeignKey
ALTER TABLE "ParticipantCode" ADD CONSTRAINT "ParticipantCode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantCode" ADD CONSTRAINT "ParticipantCode_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantCode" ADD CONSTRAINT "ParticipantCode_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
