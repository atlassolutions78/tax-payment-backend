-- Add penaltyRate to tax_rules
ALTER TABLE "tax_rules" ADD COLUMN IF NOT EXISTS "penaltyRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10;

-- Add isLate and penaltyAmount to declarations
ALTER TABLE "declarations" ADD COLUMN IF NOT EXISTS "isLate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "declarations" ADD COLUMN IF NOT EXISTS "penaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Make TaxPeriod.createdById optional (system-generated periods have no human creator)
ALTER TABLE "tax_periods" ALTER COLUMN "createdById" DROP NOT NULL;
