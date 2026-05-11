-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TAXPAYER', 'AGENT', 'GOV_OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('OPEN', 'SUBMITTED', 'CONFIRMED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'NON_FILER', 'OUTSTANDING', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "TaxPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tin" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxpayers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tin" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxpayers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TaxPeriodType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "filingDeadline" TIMESTAMP(3) NOT NULL,
    "taxTypes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "rate" DECIMAL(5,2),
    "flatAmount" DECIMAL(12,2),
    "applicableFrom" TIMESTAMP(3) NOT NULL,
    "applicableTo" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "taxPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declarations" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "taxPeriodId" TEXT NOT NULL,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'DRAFT',
    "calculatedTaxAmount" DECIMAL(15,2),
    "taxBreakdown" JSONB,
    "supportingDocuments" TEXT[],
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedZone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "status" "CollectionStatus" NOT NULL DEFAULT 'PENDING',
    "collectedAt" TIMESTAMP(3),
    "receiptUrl" TEXT,
    "remittanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittances" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "RemittanceStatus" NOT NULL DEFAULT 'OPEN',
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "collectionCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_records" (
    "id" TEXT NOT NULL,
    "taxpayerId" TEXT NOT NULL,
    "taxPeriodId" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "declarationId" TEXT,
    "collectionId" TEXT,
    "flaggedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_tin_key" ON "users"("tin");

-- CreateIndex
CREATE UNIQUE INDEX "taxpayers_userId_key" ON "taxpayers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "taxpayers_tin_key" ON "taxpayers"("tin");

-- CreateIndex
CREATE UNIQUE INDEX "declarations_taxpayerId_taxPeriodId_key" ON "declarations"("taxpayerId", "taxPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_userId_key" ON "agents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "collections_referenceNumber_key" ON "collections"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_records_taxpayerId_taxPeriodId_key" ON "compliance_records"("taxpayerId", "taxPeriodId");

-- AddForeignKey
ALTER TABLE "taxpayers" ADD CONSTRAINT "taxpayers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_periods" ADD CONSTRAINT "tax_periods_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_taxPeriodId_fkey" FOREIGN KEY ("taxPeriodId") REFERENCES "tax_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "taxpayers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_taxPeriodId_fkey" FOREIGN KEY ("taxPeriodId") REFERENCES "tax_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "declarations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "taxpayers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_remittanceId_fkey" FOREIGN KEY ("remittanceId") REFERENCES "remittances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_taxpayerId_fkey" FOREIGN KEY ("taxpayerId") REFERENCES "taxpayers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_taxPeriodId_fkey" FOREIGN KEY ("taxPeriodId") REFERENCES "tax_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "declarations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
