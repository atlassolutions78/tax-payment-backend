ALTER TABLE "declarations" ADD COLUMN IF NOT EXISTS "taxType" TEXT NOT NULL DEFAULT 'PATENTE';
ALTER TABLE "declarations" DROP CONSTRAINT IF EXISTS "declarations_taxpayerId_taxPeriodId_key";
DROP INDEX IF EXISTS "declarations_taxpayerId_taxPeriodId_key";
ALTER TABLE "declarations" DROP CONSTRAINT IF EXISTS "declarations_taxpayerId_taxPeriodId_taxType_key";
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_taxpayerId_taxPeriodId_taxType_key" UNIQUE ("taxpayerId", "taxPeriodId", "taxType");
