-- Add PAID to the enum
ALTER TYPE "DeclarationStatus" ADD VALUE IF NOT EXISTS 'PAID';

-- Remove DRAFT default, set default to SUBMITTED
ALTER TABLE "declarations" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- Migrate any existing DRAFT declarations to SUBMITTED
UPDATE "declarations" SET "status" = 'SUBMITTED', "submittedAt" = NOW() WHERE "status" = 'DRAFT';
