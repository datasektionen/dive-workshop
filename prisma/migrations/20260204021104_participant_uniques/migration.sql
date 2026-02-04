-- DropIndex
DROP INDEX "ParticipantCode_sessionId_blockId_key";

-- DropIndex
DROP INDEX "ParticipantProgress_sessionId_blockId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantCode_participantId_blockId_key" ON "ParticipantCode"("participantId", "blockId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProgress_participantId_blockId_key" ON "ParticipantProgress"("participantId", "blockId");
