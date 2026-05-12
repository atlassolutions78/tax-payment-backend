import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const SUPPORTED_TAX_TYPES = ['VAT', 'PAYE', 'WHT', 'CIT', 'TOT'];

async function main() {
  console.log('Seeding database for North Kivu Tax System...');

  // Clean existing data in dependency order
  await prisma.complianceRecord.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.remittance.deleteMany();
  await prisma.declaration.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.taxPeriod.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.taxpayer.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleared existing data');

  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------
  await prisma.user.create({
    data: {
      email: 'admin@fisc-nordkivu.cd',
      passwordHash: defaultPassword,
      role: 'ADMIN',
    },
  });

  // ---------------------------------------------------------------------------
  // Government Officers
  // ---------------------------------------------------------------------------
  const officer1 = await prisma.user.create({
    data: {
      email: 'jean.mutombo@fisc-nordkivu.cd',
      passwordHash: defaultPassword,
      role: 'GOV_OFFICER',
    },
  });
  await prisma.user.create({
    data: {
      email: 'marie.bahati@fisc-nordkivu.cd',
      passwordHash: defaultPassword,
      role: 'GOV_OFFICER',
    },
  });

  // ---------------------------------------------------------------------------
  // Agents
  // ---------------------------------------------------------------------------
  const agentUser1 = await prisma.user.create({
    data: {
      email: 'patient.kambale@fisc-nordkivu.cd',
      passwordHash: defaultPassword,
      role: 'AGENT',
    },
  });
  const agentUser2 = await prisma.user.create({
    data: {
      email: 'therese.mapendo@fisc-nordkivu.cd',
      passwordHash: defaultPassword,
      role: 'AGENT',
    },
  });
  const agentUser3 = await prisma.user.create({
    data: {
      email: 'gilbert.paluku@fisc-nordkivu.cd',
      passwordHash: defaultPassword,
      role: 'AGENT',
    },
  });

  const agent1 = await prisma.agent.create({
    data: {
      userId: agentUser1.id,
      assignedZone: 'Goma Centre',
      isActive: true,
    },
  });
  const agent2 = await prisma.agent.create({
    data: { userId: agentUser2.id, assignedZone: 'Karisimbi', isActive: true },
  });
  await prisma.agent.create({
    data: { userId: agentUser3.id, assignedZone: 'Rutshuru', isActive: true },
  });

  // ---------------------------------------------------------------------------
  // Taxpayer Users + Profiles
  // ---------------------------------------------------------------------------
  const taxpayerData = [
    {
      tin: '10438428427',
      businessName: 'Société Minière du Kivu SARL',
      sector: 'MINING',
      status: 'ACTIVE',
    },
    {
      tin: '10284736591',
      businessName: 'Gorilla Gold Mining SARL',
      sector: 'MINING',
      status: 'ACTIVE',
    },
    {
      tin: '10573829461',
      businessName: 'Coopérative Caféiculteurs du Kivu',
      sector: 'AGRICULTURE',
      status: 'ACTIVE',
    },
    {
      tin: '10192837465',
      businessName: 'Grands Lacs Commerce SARL',
      sector: 'COMMERCE',
      status: 'ACTIVE',
    },
    {
      tin: '10847362910',
      businessName: 'Virunga Trading Company SARL',
      sector: 'COMMERCE',
      status: 'ACTIVE',
    },
    {
      tin: '10362748591',
      businessName: 'Hôtel Karibu Goma',
      sector: 'HOSPITALITY',
      status: 'ACTIVE',
    },
    {
      tin: '10748291637',
      businessName: 'Trans-Kivu Transport SARL',
      sector: 'TRANSPORT',
      status: 'ACTIVE',
    },
    {
      tin: '10293847561',
      businessName: 'Bâtisseurs du Kivu SARL',
      sector: 'CONSTRUCTION',
      status: 'ACTIVE',
    },
    {
      tin: '10473829165',
      businessName: 'Kivu Digital Services SARL',
      sector: 'SERVICES',
      status: 'ACTIVE',
    },
    {
      tin: '10584726391',
      businessName: 'Pharmacie Heal Congo SARL',
      sector: 'HEALTH',
      status: 'ACTIVE',
    },
    {
      tin: '10192738465',
      businessName: 'Imprimerie Virunga SARL',
      sector: 'SERVICES',
      status: 'INACTIVE',
    },
    {
      tin: '10847293615',
      businessName: 'Agro-Kivu Distributions SARL',
      sector: 'AGRICULTURE',
      status: 'ACTIVE',
    },
  ];

  const taxpayers: Array<{ id: string; tin: string }> = [];

  for (const t of taxpayerData) {
    const user = await prisma.user.create({
      data: {
        email: `${t.tin.toLowerCase()}@taxpayer.nk`,
        passwordHash: defaultPassword,
        role: 'TAXPAYER',
      },
    });
    const taxpayer = await prisma.taxpayer.create({
      data: {
        userId: user.id,
        tin: t.tin,
        businessName: t.businessName,
        sector: t.sector,
        status: t.status,
      },
    });
    taxpayers.push({ id: taxpayer.id, tin: taxpayer.tin });
  }

  console.log('✓ Users, agents and taxpayers created');

  // ---------------------------------------------------------------------------
  // Tax Periods
  // ---------------------------------------------------------------------------
  await prisma.taxPeriod.create({
    data: {
      id: 'period-2025-07',
      name: 'July 2025',
      type: 'MONTHLY',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-31'),
      filingDeadline: new Date('2025-08-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2025-08',
      name: 'August 2025',
      type: 'MONTHLY',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-31'),
      filingDeadline: new Date('2025-09-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2025-09',
      name: 'September 2025',
      type: 'MONTHLY',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-30'),
      filingDeadline: new Date('2025-10-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2025-10',
      name: 'October 2025',
      type: 'MONTHLY',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-10-31'),
      filingDeadline: new Date('2025-11-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2025-11',
      name: 'November 2025',
      type: 'MONTHLY',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      filingDeadline: new Date('2025-12-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2025-12',
      name: 'December 2025',
      type: 'MONTHLY',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-31'),
      filingDeadline: new Date('2026-01-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2026-01',
      name: 'January 2026',
      type: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      filingDeadline: new Date('2026-02-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2026-02',
      name: 'February 2026',
      type: 'MONTHLY',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      filingDeadline: new Date('2026-03-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  await prisma.taxPeriod.create({
    data: {
      id: 'period-2026-03',
      name: 'March 2026',
      type: 'MONTHLY',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
      filingDeadline: new Date('2026-04-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  const q1Period = await prisma.taxPeriod.create({
    data: {
      id: 'period-q1-2026',
      name: 'April 2026',
      type: 'MONTHLY',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      filingDeadline: new Date('2026-05-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  const q2Period = await prisma.taxPeriod.create({
    data: {
      id: 'period-q2-2026',
      name: 'May 2026',
      type: 'MONTHLY',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-31'),
      filingDeadline: new Date('2026-06-15'),
      taxTypes: SUPPORTED_TAX_TYPES,
      isActive: true,
    },
  });

  console.log('✓ Tax periods created');

  // ---------------------------------------------------------------------------
  // Tax Rules — flat amounts per tax type, modifiable by officers
  // ---------------------------------------------------------------------------
  const globalTaxRules = [
    {
      id: 'rule-vat',
      taxType: 'VAT',
      name: 'Value Added Tax (VAT)',
      flatAmount: 200,
      penaltyRate: 0.1,
    },
    {
      id: 'rule-paye',
      taxType: 'PAYE',
      name: 'Pay-As-You-Earn (PAYE)',
      flatAmount: 150,
      penaltyRate: 0.1,
    },
    {
      id: 'rule-wht',
      taxType: 'WHT',
      name: 'Withholding Tax (WHT)',
      flatAmount: 100,
      penaltyRate: 0.1,
    },
    {
      id: 'rule-cit',
      taxType: 'CIT',
      name: 'Corporate Income Tax (CIT)',
      flatAmount: 300,
      penaltyRate: 0.1,
    },
    {
      id: 'rule-tot',
      taxType: 'TOT',
      name: 'Turnover Tax (TOT)',
      flatAmount: 80,
      penaltyRate: 0.1,
    },
  ];

  const ruleAmounts: Record<string, number> = {};

  for (const r of globalTaxRules) {
    await prisma.taxRule.create({
      data: {
        id: r.id,
        taxType: r.taxType,
        name: r.name,
        condition: {},
        flatAmount: r.flatAmount,
        penaltyRate: r.penaltyRate,
        applicableFrom: new Date('2026-01-01'),
        priority: 1,
        isActive: true,
        createdById: officer1.id,
      },
    });
    ruleAmounts[r.taxType] = r.flatAmount;
  }

  console.log('✓ Tax rules created');

  // ---------------------------------------------------------------------------
  // April 2026 Declarations — 8 taxpayers filed (6 PAID, 2 SUBMITTED)
  // ---------------------------------------------------------------------------
  const activeTaxpayers = taxpayers.filter(
    (tp) => taxpayerData.find((t) => t.tin === tp.tin)!.status === 'ACTIVE',
  );

  const submittedDeclarations: Array<{
    id: string;
    taxpayerId: string;
    amount: number;
  }> = [];

  for (let i = 0; i < 8; i++) {
    const tp = activeTaxpayers[i];
    const taxType = SUPPORTED_TAX_TYPES[i % SUPPORTED_TAX_TYPES.length];
    const amount = ruleAmounts[taxType];
    const rule = globalTaxRules.find((r) => r.taxType === taxType)!;
    const decl = await prisma.declaration.create({
      data: {
        taxpayerId: tp.id,
        taxPeriodId: q1Period.id,
        status: 'SUBMITTED',
        calculatedTaxAmount: amount,
        penaltyAmount: 0,
        isLate: false,
        taxType,
        taxBreakdown: {
          rule: rule.name,
          taxType,
          flatAmount: amount,
          penaltyRate: rule.penaltyRate,
        },
        supportingDocuments: [],
        submittedAt: new Date(`2026-04-${String(10 + i).padStart(2, '0')}`),
      },
    });
    submittedDeclarations.push({
      id: decl.id,
      taxpayerId: decl.taxpayerId,
      amount,
    });
  }

  console.log('✓ April 2026 declarations created');

  // ---------------------------------------------------------------------------
  // Remittances
  // ---------------------------------------------------------------------------
  const remittance1 = await prisma.remittance.create({
    data: {
      agentId: agent1.id,
      status: 'CONFIRMED',
      totalAmount: 0,
      collectionCount: 0,
      submittedAt: new Date('2026-04-25'),
      confirmedById: officer1.id,
      confirmedAt: new Date('2026-04-26'),
    },
  });

  const remittance2 = await prisma.remittance.create({
    data: {
      agentId: agent2.id,
      status: 'SUBMITTED',
      totalAmount: 0,
      collectionCount: 0,
      submittedAt: new Date('2026-04-28'),
    },
  });

  // ---------------------------------------------------------------------------
  // Collections — 6 of 8 submitted declarations collected
  // ---------------------------------------------------------------------------
  const collectionsConfig = [
    { declIdx: 0, agent: agent1, remittance: remittance1, date: '2026-04-20' },
    { declIdx: 1, agent: agent1, remittance: remittance1, date: '2026-04-20' },
    { declIdx: 2, agent: agent1, remittance: remittance1, date: '2026-04-21' },
    { declIdx: 3, agent: agent2, remittance: remittance2, date: '2026-04-22' },
    { declIdx: 4, agent: agent2, remittance: remittance2, date: '2026-04-23' },
    { declIdx: 5, agent: agent2, remittance: remittance2, date: '2026-04-23' },
  ];

  const collections: Array<{
    id: string;
    taxpayerId: string;
    declarationId: string;
    amount: number;
    collectedAt: Date;
  }> = [];

  for (let i = 0; i < collectionsConfig.length; i++) {
    const c = collectionsConfig[i];
    const decl = submittedDeclarations[c.declIdx];
    const col = await prisma.collection.create({
      data: {
        agentId: c.agent.id,
        declarationId: decl.id,
        taxpayerId: decl.taxpayerId,
        amount: decl.amount,
        method: i % 2 === 0 ? 'CASH' : 'MOBILE_MONEY',
        referenceNumber: `COL-2026-${String(1000 + i).padStart(6, '0')}`,
        status: 'COMPLETED',
        collectedAt: new Date(c.date),
        remittanceId: c.remittance.id,
      },
    });
    collections.push({
      id: col.id,
      taxpayerId: col.taxpayerId,
      declarationId: col.declarationId,
      amount: decl.amount,
      collectedAt: new Date(c.date),
    });
  }

  await prisma.remittance.update({
    where: { id: remittance1.id },
    data: {
      totalAmount: collections.slice(0, 3).reduce((s, c) => s + c.amount, 0),
      collectionCount: 3,
    },
  });
  await prisma.remittance.update({
    where: { id: remittance2.id },
    data: {
      totalAmount: collections.slice(3).reduce((s, c) => s + c.amount, 0),
      collectionCount: 3,
    },
  });

  // Mark collected declarations as PAID
  for (const col of collections) {
    await prisma.declaration.update({
      where: { id: col.declarationId },
      data: { status: 'PAID' },
    });
  }

  console.log('✓ Collections and remittances created');

  // ---------------------------------------------------------------------------
  // Compliance Records for Q1 2026
  // ---------------------------------------------------------------------------
  for (const col of collections) {
    await prisma.complianceRecord.create({
      data: {
        taxpayerId: col.taxpayerId,
        taxPeriodId: q1Period.id,
        status: 'COMPLIANT',
        declarationId: col.declarationId,
        collectionId: col.id,
        resolvedAt: col.collectedAt,
      },
    });
  }

  for (const decl of submittedDeclarations.slice(6)) {
    await prisma.complianceRecord.create({
      data: {
        taxpayerId: decl.taxpayerId,
        taxPeriodId: q1Period.id,
        status: 'OUTSTANDING',
        declarationId: decl.id,
        flaggedAt: new Date('2026-05-01'),
      },
    });
  }

  const inactiveTaxpayer = taxpayers.find(
    (tp) => taxpayerData.find((t) => t.tin === tp.tin)!.status === 'INACTIVE',
  )!;

  await prisma.complianceRecord.create({
    data: {
      taxpayerId: inactiveTaxpayer.id,
      taxPeriodId: q1Period.id,
      status: 'NON_FILER',
      flaggedAt: new Date('2026-05-01'),
    },
  });

  console.log('✓ Compliance records created');

  // ---------------------------------------------------------------------------
  // Q2 Declarations — 3 early filers
  // ---------------------------------------------------------------------------
  for (let i = 0; i < 3; i++) {
    const tp = activeTaxpayers[i];
    const taxType = SUPPORTED_TAX_TYPES[i % SUPPORTED_TAX_TYPES.length];
    const amount = ruleAmounts[taxType];
    const rule = globalTaxRules.find((r) => r.taxType === taxType)!;
    await prisma.declaration.create({
      data: {
        taxpayerId: tp.id,
        taxPeriodId: q2Period.id,
        status: 'SUBMITTED',
        calculatedTaxAmount: amount,
        penaltyAmount: 0,
        isLate: false,
        taxType,
        taxBreakdown: {
          rule: rule.name,
          taxType,
          flatAmount: amount,
          penaltyRate: rule.penaltyRate,
        },
        supportingDocuments: [],
        submittedAt: new Date('2026-05-05'),
      },
    });
  }

  console.log('✓ Q2 early declarations created');

  // ---------------------------------------------------------------------------
  // Kivu Digital Services — 20 PAID declarations across historical months
  // ---------------------------------------------------------------------------
  const kivuDigital = activeTaxpayers[8];

  const kivuDeclarations = [
    // July 2025
    {
      periodId: 'period-2025-07',
      taxType: 'VAT',
      amount: 200,
      penalty: 20,
      submittedAt: '2025-08-20',
      collectedAt: '2025-08-21',
      method: 'CASH',
      ref: 'KD-2025-07-001',
    },
    {
      periodId: 'period-2025-07',
      taxType: 'PAYE',
      amount: 150,
      penalty: 15,
      submittedAt: '2025-08-20',
      collectedAt: '2025-08-21',
      method: 'MOBILE_MONEY',
      ref: 'KD-2025-07-002',
    },
    {
      periodId: 'period-2025-07',
      taxType: 'WHT',
      amount: 100,
      penalty: 10,
      submittedAt: '2025-08-22',
      collectedAt: '2025-08-23',
      method: 'CASH',
      ref: 'KD-2025-07-003',
    },
    // August 2025
    {
      periodId: 'period-2025-08',
      taxType: 'CIT',
      amount: 300,
      penalty: 30,
      submittedAt: '2025-09-18',
      collectedAt: '2025-09-19',
      method: 'CASH',
      ref: 'KD-2025-08-001',
    },
    {
      periodId: 'period-2025-08',
      taxType: 'TOT',
      amount: 80,
      penalty: 8,
      submittedAt: '2025-09-18',
      collectedAt: '2025-09-19',
      method: 'MOBILE_MONEY',
      ref: 'KD-2025-08-002',
    },
    {
      periodId: 'period-2025-08',
      taxType: 'VAT',
      amount: 200,
      penalty: 20,
      submittedAt: '2025-09-20',
      collectedAt: '2025-09-21',
      method: 'CASH',
      ref: 'KD-2025-08-003',
    },
    // September 2025
    {
      periodId: 'period-2025-09',
      taxType: 'PAYE',
      amount: 150,
      penalty: 15,
      submittedAt: '2025-10-17',
      collectedAt: '2025-10-18',
      method: 'MOBILE_MONEY',
      ref: 'KD-2025-09-001',
    },
    {
      periodId: 'period-2025-09',
      taxType: 'WHT',
      amount: 100,
      penalty: 10,
      submittedAt: '2025-10-17',
      collectedAt: '2025-10-18',
      method: 'CASH',
      ref: 'KD-2025-09-002',
    },
    // October 2025
    {
      periodId: 'period-2025-10',
      taxType: 'CIT',
      amount: 300,
      penalty: 30,
      submittedAt: '2025-11-18',
      collectedAt: '2025-11-19',
      method: 'CASH',
      ref: 'KD-2025-10-001',
    },
    {
      periodId: 'period-2025-10',
      taxType: 'TOT',
      amount: 80,
      penalty: 8,
      submittedAt: '2025-11-18',
      collectedAt: '2025-11-19',
      method: 'MOBILE_MONEY',
      ref: 'KD-2025-10-002',
    },
    {
      periodId: 'period-2025-10',
      taxType: 'VAT',
      amount: 200,
      penalty: 20,
      submittedAt: '2025-11-20',
      collectedAt: '2025-11-21',
      method: 'CASH',
      ref: 'KD-2025-10-003',
    },
    // November 2025
    {
      periodId: 'period-2025-11',
      taxType: 'PAYE',
      amount: 150,
      penalty: 15,
      submittedAt: '2025-12-18',
      collectedAt: '2025-12-19',
      method: 'CASH',
      ref: 'KD-2025-11-001',
    },
    {
      periodId: 'period-2025-11',
      taxType: 'WHT',
      amount: 100,
      penalty: 10,
      submittedAt: '2025-12-18',
      collectedAt: '2025-12-19',
      method: 'MOBILE_MONEY',
      ref: 'KD-2025-11-002',
    },
    // December 2025
    {
      periodId: 'period-2025-12',
      taxType: 'CIT',
      amount: 300,
      penalty: 30,
      submittedAt: '2026-01-17',
      collectedAt: '2026-01-18',
      method: 'CASH',
      ref: 'KD-2025-12-001',
    },
    {
      periodId: 'period-2025-12',
      taxType: 'TOT',
      amount: 80,
      penalty: 8,
      submittedAt: '2026-01-17',
      collectedAt: '2026-01-18',
      method: 'MOBILE_MONEY',
      ref: 'KD-2025-12-002',
    },
    // January 2026
    {
      periodId: 'period-2026-01',
      taxType: 'VAT',
      amount: 200,
      penalty: 20,
      submittedAt: '2026-02-18',
      collectedAt: '2026-02-19',
      method: 'CASH',
      ref: 'KD-2026-01-001',
    },
    {
      periodId: 'period-2026-01',
      taxType: 'PAYE',
      amount: 150,
      penalty: 15,
      submittedAt: '2026-02-18',
      collectedAt: '2026-02-19',
      method: 'MOBILE_MONEY',
      ref: 'KD-2026-01-002',
    },
    // February 2026
    {
      periodId: 'period-2026-02',
      taxType: 'VAT',
      amount: 200,
      penalty: 20,
      submittedAt: '2026-03-20',
      collectedAt: '2026-03-21',
      method: 'CASH',
      ref: 'KD-2026-02-001',
    },
    {
      periodId: 'period-2026-02',
      taxType: 'WHT',
      amount: 100,
      penalty: 10,
      submittedAt: '2026-03-20',
      collectedAt: '2026-03-21',
      method: 'MOBILE_MONEY',
      ref: 'KD-2026-02-002',
    },
    // March 2026
    {
      periodId: 'period-2026-03',
      taxType: 'TOT',
      amount: 80,
      penalty: 8,
      submittedAt: '2026-04-18',
      collectedAt: '2026-04-19',
      method: 'CASH',
      ref: 'KD-2026-03-001',
    },
  ];

  for (const d of kivuDeclarations) {
    const rule = globalTaxRules.find((r) => r.taxType === d.taxType)!;
    const decl = await prisma.declaration.create({
      data: {
        taxpayerId: kivuDigital.id,
        taxPeriodId: d.periodId,
        status: 'PAID',
        calculatedTaxAmount: d.amount,
        penaltyAmount: d.penalty,
        isLate: true,
        taxType: d.taxType,
        taxBreakdown: {
          rule: rule.name,
          taxType: d.taxType,
          flatAmount: d.amount,
          penaltyRate: rule.penaltyRate,
        },
        supportingDocuments: [],
        submittedAt: new Date(d.submittedAt),
      },
    });

    await prisma.collection.create({
      data: {
        agentId: agent1.id,
        declarationId: decl.id,
        taxpayerId: kivuDigital.id,
        amount: d.amount + d.penalty,
        method: d.method,
        referenceNumber: d.ref,
        status: 'COMPLETED',
        collectedAt: new Date(d.collectedAt),
      },
    });
  }

  console.log('✓ Kivu Digital declarations created (20 PAID)');
  console.log('\nSeed complete.');
  console.log('  Default password for all accounts: Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
