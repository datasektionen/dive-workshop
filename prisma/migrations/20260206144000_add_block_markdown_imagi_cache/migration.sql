CREATE TABLE "BlockMarkdownImagiCache" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "snippetKey" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "frames" JSONB NOT NULL,
    "loopCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockMarkdownImagiCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlockMarkdownImagiCache_blockId_snippetKey_key"
ON "BlockMarkdownImagiCache"("blockId", "snippetKey");

CREATE INDEX "BlockMarkdownImagiCache_blockId_idx"
ON "BlockMarkdownImagiCache"("blockId");

ALTER TABLE "BlockMarkdownImagiCache"
ADD CONSTRAINT "BlockMarkdownImagiCache_blockId_fkey"
FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
