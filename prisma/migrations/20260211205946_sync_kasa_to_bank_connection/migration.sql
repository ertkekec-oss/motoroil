/*
  Warnings:

  - A unique constraint covering the columns `[bankConnectionId]` on the table `Kasa` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Kasa" ADD COLUMN     "bankConnectionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Kasa_bankConnectionId_key" ON "Kasa"("bankConnectionId");
