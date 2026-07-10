-- AlterTable
ALTER TABLE "call_summaries" ALTER COLUMN "callbackRequired" DROP NOT NULL,
ALTER COLUMN "callbackRequired" DROP DEFAULT;
