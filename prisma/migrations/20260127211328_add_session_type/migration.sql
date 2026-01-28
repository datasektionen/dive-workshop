/*
  Warnings:

  - Added the required column `type` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "adminId" DROP NOT NULL;
