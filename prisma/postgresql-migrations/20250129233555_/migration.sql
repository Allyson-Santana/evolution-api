/*
  Warnings:

  - A unique constraint covering the columns `[remoteJid,instanceId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chat_remoteJid_instanceId_key" ON "Chat"("remoteJid", "instanceId");
