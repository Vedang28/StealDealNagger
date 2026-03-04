-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invite_status" TEXT NOT NULL DEFAULT 'accepted',
ADD COLUMN     "invited_at" TIMESTAMP(3);
