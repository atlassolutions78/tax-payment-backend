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

async function upsertUser(
  email: string,
  role: string,
  passwordHash: string,
  name: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, passwordHash, role: role as never, name },
  });
}

async function main() {
  console.log('Seeding database for North Kivu Tax System...');

  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------
  await upsertUser(
    'admin@fisc-nordkivu.cd',
    'ADMIN',
    defaultPassword,
    'System Admin',
  );

  // ---------------------------------------------------------------------------
  // Government Officers
  // ---------------------------------------------------------------------------
  const officer1 = await upsertUser(
    'jean.mutombo@fisc-nordkivu.cd',
    'GOV_OFFICER',
    defaultPassword,
    'Jean Mutombo',
  );
  await upsertUser(
    'marie.bahati@fisc-nordkivu.cd',
    'GOV_OFFICER',
    defaultPassword,
    'Marie Bahati',
  );

  // ---------------------------------------------------------------------------
  // Agents
  // ---------------------------------------------------------------------------
  const agentUser1 = await upsertUser(
    'patient.kambale@fisc-nordkivu.cd',
    'AGENT',
    defaultPassword,
    'Patient Kambale',
  );
  const agentUser2 = await upsertUser(
    'therese.mapendo@fisc-nordkivu.cd',
    'AGENT',
    defaultPassword,
    'Thérèse Mapendo',
  );
  const agentUser3 = await upsertUser(
    'gilbert.paluku@fisc-nordkivu.cd',
    'AGENT',
    defaultPassword,
    'Gilbert Paluku',
  );

  const agent1 = await prisma.agent.upsert({
    where: { userId: agentUser1.id },
    update: {},
    create: {
      userId: agentUser1.id,
      assignedZone: 'Goma Centre',
      isActive: true,
    },
  });
  const agent2 = await prisma.agent.upsert({
    where: { userId: agentUser2.id },
    update: {},
    create: {
      userId: agentUser2.id,
      assignedZone: 'Karisimbi',
      isActive: true,
    },
  });
  await prisma.agent.upsert({
    where: { userId: agentUser3.id },
    update: {},
    create: { userId: agentUser3.id, assignedZone: 'Rutshuru', isActive: true },
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
    const email = `${t.tin.toLowerCase()}@taxpayer.nk`;
    const user = await upsertUser(
      email,
      'TAXPAYER',
      defaultPassword,
      t.businessName,
    );
    const taxpayer = await prisma.taxpayer.upsert({
      where: { tin: t.tin },
      update: {},
      create: {
        userId: user.id,
        tin: t.tin,
        businessName: t.businessName,
        sector: t.sector,
        status: t.status,
      },
    });
    taxpayers.push({ id: taxpayer.id, tin: taxpayer.tin });
  }

  console.log('✓ Users, agents and taxpayers');

  // ---------------------------------------------------------------------------
  // Tax Periods
  // ---------------------------------------------------------------------------
  const periodDefs = [
    {
      id: 'period-2025-07',
      name: 'July 2025',
      start: '2025-07-01',
      end: '2025-07-31',
      deadline: '2025-08-15',
    },
    {
      id: 'period-2025-08',
      name: 'August 2025',
      start: '2025-08-01',
      end: '2025-08-31',
      deadline: '2025-09-15',
    },
    {
      id: 'period-2025-09',
      name: 'September 2025',
      start: '2025-09-01',
      end: '2025-09-30',
      deadline: '2025-10-15',
    },
    {
      id: 'period-2025-10',
      name: 'October 2025',
      start: '2025-10-01',
      end: '2025-10-31',
      deadline: '2025-11-15',
    },
    {
      id: 'period-2025-11',
      name: 'November 2025',
      start: '2025-11-01',
      end: '2025-11-30',
      deadline: '2025-12-15',
    },
    {
      id: 'period-2025-12',
      name: 'December 2025',
      start: '2025-12-01',
      end: '2025-12-31',
      deadline: '2026-01-15',
    },
    {
      id: 'period-2026-01',
      name: 'January 2026',
      start: '2026-01-01',
      end: '2026-01-31',
      deadline: '2026-02-15',
    },
    {
      id: 'period-2026-02',
      name: 'February 2026',
      start: '2026-02-01',
      end: '2026-02-28',
      deadline: '2026-03-15',
    },
    {
      id: 'period-2026-03',
      name: 'March 2026',
      start: '2026-03-01',
      end: '2026-03-31',
      deadline: '2026-04-15',
    },
    {
      id: 'period-q1-2026',
      name: 'April 2026',
      start: '2026-04-01',
      end: '2026-04-30',
      deadline: '2026-05-15',
    },
    {
      id: 'period-q2-2026',
      name: 'May 2026',
      start: '2026-05-01',
      end: '2026-05-31',
      deadline: '2026-06-15',
    },
  ];

  for (const p of periodDefs) {
    await prisma.taxPeriod.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        type: 'MONTHLY',
        startDate: new Date(p.start),
        endDate: new Date(p.end),
        filingDeadline: new Date(p.deadline),
        taxTypes: SUPPORTED_TAX_TYPES,
        isActive: true,
      },
    });
  }

  const q1Period = { id: 'period-q1-2026' };
  const q2Period = { id: 'period-q2-2026' };

  console.log('✓ Tax periods');

  // ---------------------------------------------------------------------------
  // Tax Rules
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
    await prisma.taxRule.upsert({
      where: { id: r.id },
      update: {},
      create: {
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

  console.log('✓ Tax rules');

  // ---------------------------------------------------------------------------
  // April 2026 Declarations — 8 taxpayers filed
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
    const decl = await prisma.declaration.upsert({
      where: {
        taxpayerId_taxPeriodId_taxType: {
          taxpayerId: tp.id,
          taxPeriodId: q1Period.id,
          taxType,
        },
      },
      update: {},
      create: {
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

  console.log('✓ April 2026 declarations');

  // ---------------------------------------------------------------------------
  // Remittances
  // ---------------------------------------------------------------------------
  const remittance1 = await prisma.remittance.upsert({
    where: { id: 'remittance-april-2026-1' },
    update: {},
    create: {
      id: 'remittance-april-2026-1',
      agentId: agent1.id,
      status: 'CONFIRMED',
      totalAmount: 0,
      collectionCount: 0,
      submittedAt: new Date('2026-04-25'),
      confirmedById: officer1.id,
      confirmedAt: new Date('2026-04-26'),
    },
  });

  const remittance2 = await prisma.remittance.upsert({
    where: { id: 'remittance-april-2026-2' },
    update: {},
    create: {
      id: 'remittance-april-2026-2',
      agentId: agent2.id,
      status: 'SUBMITTED',
      totalAmount: 0,
      collectionCount: 0,
      submittedAt: new Date('2026-04-28'),
    },
  });

  // ---------------------------------------------------------------------------
  // Collections — 6 of 8 April declarations collected
  // ---------------------------------------------------------------------------
  const collectionsConfig = [
    {
      declIdx: 0,
      agent: agent1,
      remittance: remittance1,
      date: '2026-04-20',
      ref: 'COL-2026-001000',
    },
    {
      declIdx: 1,
      agent: agent1,
      remittance: remittance1,
      date: '2026-04-20',
      ref: 'COL-2026-001001',
    },
    {
      declIdx: 2,
      agent: agent1,
      remittance: remittance1,
      date: '2026-04-21',
      ref: 'COL-2026-001002',
    },
    {
      declIdx: 3,
      agent: agent2,
      remittance: remittance2,
      date: '2026-04-22',
      ref: 'COL-2026-001003',
    },
    {
      declIdx: 4,
      agent: agent2,
      remittance: remittance2,
      date: '2026-04-23',
      ref: 'COL-2026-001004',
    },
    {
      declIdx: 5,
      agent: agent2,
      remittance: remittance2,
      date: '2026-04-23',
      ref: 'COL-2026-001005',
    },
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
    const col = await prisma.collection.upsert({
      where: { referenceNumber: c.ref },
      update: {},
      create: {
        agentId: c.agent.id,
        declarationId: decl.id,
        taxpayerId: decl.taxpayerId,
        amount: decl.amount,
        method: 'CASH',
        referenceNumber: c.ref,
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

  for (const col of collections) {
    await prisma.declaration.update({
      where: { id: col.declarationId },
      data: { status: 'PAID' },
    });
  }

  console.log('✓ Collections and remittances');

  // ---------------------------------------------------------------------------
  // Compliance Records — April 2026
  // ---------------------------------------------------------------------------
  for (const col of collections) {
    await prisma.complianceRecord.upsert({
      where: {
        taxpayerId_taxPeriodId: {
          taxpayerId: col.taxpayerId,
          taxPeriodId: q1Period.id,
        },
      },
      update: {},
      create: {
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
    await prisma.complianceRecord.upsert({
      where: {
        taxpayerId_taxPeriodId: {
          taxpayerId: decl.taxpayerId,
          taxPeriodId: q1Period.id,
        },
      },
      update: {},
      create: {
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

  await prisma.complianceRecord.upsert({
    where: {
      taxpayerId_taxPeriodId: {
        taxpayerId: inactiveTaxpayer.id,
        taxPeriodId: q1Period.id,
      },
    },
    update: {},
    create: {
      taxpayerId: inactiveTaxpayer.id,
      taxPeriodId: q1Period.id,
      status: 'NON_FILER',
      flaggedAt: new Date('2026-05-01'),
    },
  });

  console.log('✓ Compliance records');

  // ---------------------------------------------------------------------------
  // May 2026 — 3 early filers
  // ---------------------------------------------------------------------------
  for (let i = 0; i < 3; i++) {
    const tp = activeTaxpayers[i];
    const taxType = SUPPORTED_TAX_TYPES[i % SUPPORTED_TAX_TYPES.length];
    const amount = ruleAmounts[taxType];
    const rule = globalTaxRules.find((r) => r.taxType === taxType)!;
    await prisma.declaration.upsert({
      where: {
        taxpayerId_taxPeriodId_taxType: {
          taxpayerId: tp.id,
          taxPeriodId: q2Period.id,
          taxType,
        },
      },
      update: {},
      create: {
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

  console.log('✓ May 2026 early declarations');

  // ---------------------------------------------------------------------------
  // Kivu Digital Services — varied history across 11 months
  // ---------------------------------------------------------------------------
  const kivuDigital = activeTaxpayers[8];

  type KivuDecl = {
    taxType: string;
    amount: number;
    penalty: number;
    isLate: boolean;
    submittedAt: string;
    collection: { ref: string; method: string; collectedAt: string } | null;
  };

  const kivuPeriods: Array<{
    periodId: string;
    complianceStatus: 'COMPLIANT' | 'OUTSTANDING';
    declarations: KivuDecl[];
  }> = [
    // Jul 2025 — on time, fully paid
    {
      periodId: 'period-2025-07',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'VAT',
          amount: 200,
          penalty: 0,
          isLate: false,
          submittedAt: '2025-08-10',
          collection: {
            ref: 'KD-2025-07-VAT',
            method: 'CASH',
            collectedAt: '2025-08-12',
          },
        },
        {
          taxType: 'PAYE',
          amount: 150,
          penalty: 0,
          isLate: false,
          submittedAt: '2025-08-10',
          collection: {
            ref: 'KD-2025-07-PAYE',
            method: 'CASH',
            collectedAt: '2025-08-12',
          },
        },
      ],
    },
    // Aug 2025 — filed late, paid with penalty
    {
      periodId: 'period-2025-08',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'CIT',
          amount: 300,
          penalty: 30,
          isLate: true,
          submittedAt: '2025-09-20',
          collection: {
            ref: 'KD-2025-08-CIT',
            method: 'CASH',
            collectedAt: '2025-09-21',
          },
        },
      ],
    },
    // Sep 2025 — on time, paid
    {
      periodId: 'period-2025-09',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'WHT',
          amount: 100,
          penalty: 0,
          isLate: false,
          submittedAt: '2025-10-08',
          collection: {
            ref: 'KD-2025-09-WHT',
            method: 'CASH',
            collectedAt: '2025-10-09',
          },
        },
        {
          taxType: 'TOT',
          amount: 80,
          penalty: 0,
          isLate: false,
          submittedAt: '2025-10-08',
          collection: {
            ref: 'KD-2025-09-TOT',
            method: 'CASH',
            collectedAt: '2025-10-09',
          },
        },
      ],
    },
    // Oct 2025 — filed late, paid with penalty
    {
      periodId: 'period-2025-10',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'VAT',
          amount: 200,
          penalty: 20,
          isLate: true,
          submittedAt: '2025-11-22',
          collection: {
            ref: 'KD-2025-10-VAT',
            method: 'CASH',
            collectedAt: '2025-11-23',
          },
        },
        {
          taxType: 'PAYE',
          amount: 150,
          penalty: 15,
          isLate: true,
          submittedAt: '2025-11-22',
          collection: {
            ref: 'KD-2025-10-PAYE',
            method: 'CASH',
            collectedAt: '2025-11-23',
          },
        },
      ],
    },
    // Nov 2025 — on time, paid
    {
      periodId: 'period-2025-11',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'CIT',
          amount: 300,
          penalty: 0,
          isLate: false,
          submittedAt: '2025-12-10',
          collection: {
            ref: 'KD-2025-11-CIT',
            method: 'CASH',
            collectedAt: '2025-12-11',
          },
        },
      ],
    },
    // Dec 2025 — filed late, paid with penalty
    {
      periodId: 'period-2025-12',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'TOT',
          amount: 80,
          penalty: 8,
          isLate: true,
          submittedAt: '2026-01-20',
          collection: {
            ref: 'KD-2025-12-TOT',
            method: 'CASH',
            collectedAt: '2026-01-21',
          },
        },
        {
          taxType: 'WHT',
          amount: 100,
          penalty: 10,
          isLate: true,
          submittedAt: '2026-01-20',
          collection: {
            ref: 'KD-2025-12-WHT',
            method: 'CASH',
            collectedAt: '2026-01-21',
          },
        },
      ],
    },
    // Jan 2026 — on time, paid
    {
      periodId: 'period-2026-01',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'VAT',
          amount: 200,
          penalty: 0,
          isLate: false,
          submittedAt: '2026-02-10',
          collection: {
            ref: 'KD-2026-01-VAT',
            method: 'CASH',
            collectedAt: '2026-02-11',
          },
        },
        {
          taxType: 'WHT',
          amount: 100,
          penalty: 0,
          isLate: false,
          submittedAt: '2026-02-10',
          collection: {
            ref: 'KD-2026-01-WHT',
            method: 'CASH',
            collectedAt: '2026-02-11',
          },
        },
      ],
    },
    // Feb 2026 — filed on time but NOT yet collected → OUTSTANDING
    {
      periodId: 'period-2026-02',
      complianceStatus: 'OUTSTANDING',
      declarations: [
        {
          taxType: 'PAYE',
          amount: 150,
          penalty: 0,
          isLate: false,
          submittedAt: '2026-03-08',
          collection: null,
        },
      ],
    },
    // Mar 2026 — filed late, paid with penalty
    {
      periodId: 'period-2026-03',
      complianceStatus: 'COMPLIANT',
      declarations: [
        {
          taxType: 'CIT',
          amount: 300,
          penalty: 30,
          isLate: true,
          submittedAt: '2026-04-20',
          collection: {
            ref: 'KD-2026-03-CIT',
            method: 'CASH',
            collectedAt: '2026-04-21',
          },
        },
        {
          taxType: 'TOT',
          amount: 80,
          penalty: 8,
          isLate: true,
          submittedAt: '2026-04-20',
          collection: {
            ref: 'KD-2026-03-TOT',
            method: 'CASH',
            collectedAt: '2026-04-21',
          },
        },
      ],
    },
    // Apr 2026 — filed on time, waiting for collection → OUTSTANDING
    {
      periodId: 'period-q1-2026',
      complianceStatus: 'OUTSTANDING',
      declarations: [
        {
          taxType: 'WHT',
          amount: 100,
          penalty: 0,
          isLate: false,
          submittedAt: '2026-05-10',
          collection: null,
        },
      ],
    },
    // May 2026 — early filer, not yet collected → OUTSTANDING
    {
      periodId: 'period-q2-2026',
      complianceStatus: 'OUTSTANDING',
      declarations: [
        {
          taxType: 'VAT',
          amount: 200,
          penalty: 0,
          isLate: false,
          submittedAt: '2026-05-12',
          collection: null,
        },
      ],
    },
  ];

  for (const period of kivuPeriods) {
    let firstDeclId: string | null = null;
    let firstColId: string | null = null;
    let firstColDate: Date | null = null;

    for (const d of period.declarations) {
      const rule = globalTaxRules.find((r) => r.taxType === d.taxType)!;
      const decl = await prisma.declaration.upsert({
        where: {
          taxpayerId_taxPeriodId_taxType: {
            taxpayerId: kivuDigital.id,
            taxPeriodId: period.periodId,
            taxType: d.taxType,
          },
        },
        update: {},
        create: {
          taxpayerId: kivuDigital.id,
          taxPeriodId: period.periodId,
          status: d.collection ? 'PAID' : 'SUBMITTED',
          calculatedTaxAmount: d.amount,
          penaltyAmount: d.penalty,
          isLate: d.isLate,
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

      if (!firstDeclId) firstDeclId = decl.id;

      if (d.collection) {
        const col = await prisma.collection.upsert({
          where: { referenceNumber: d.collection.ref },
          update: {},
          create: {
            agentId: agent1.id,
            declarationId: decl.id,
            taxpayerId: kivuDigital.id,
            amount: d.amount + d.penalty,
            method: d.collection.method,
            referenceNumber: d.collection.ref,
            collectedAt: new Date(d.collection.collectedAt),
          },
        });
        if (!firstColId) {
          firstColId = col.id;
          firstColDate = new Date(d.collection.collectedAt);
        }
      }
    }

    await prisma.complianceRecord.upsert({
      where: {
        taxpayerId_taxPeriodId: {
          taxpayerId: kivuDigital.id,
          taxPeriodId: period.periodId,
        },
      },
      update: {},
      create: {
        taxpayerId: kivuDigital.id,
        taxPeriodId: period.periodId,
        status: period.complianceStatus,
        declarationId: firstDeclId,
        collectionId: firstColId,
        resolvedAt: firstColDate,
        flaggedAt:
          period.complianceStatus === 'OUTSTANDING'
            ? new Date('2026-05-13')
            : null,
      },
    });
  }

  console.log('✓ Kivu Digital Services data');

  // ---------------------------------------------------------------------------
  // Gilbert Paluku — collections of different statuses
  // ---------------------------------------------------------------------------
  const gilbert = await prisma.agent.findFirst({
    where: { user: { email: 'gilbert.paluku@fisc-nordkivu.cd' } },
  });

  const pharmacie = activeTaxpayers[9]; // Pharmacie Heal Congo
  const agroKivu = activeTaxpayers[10]; // Agro-Kivu Distributions

  const gilbertDeclarations = [
    // April 2026 — on time
    {
      taxpayerId: pharmacie.id,
      periodId: 'period-q1-2026',
      taxType: 'VAT',
      amount: 200,
      penalty: 0,
      isLate: false,
      submittedAt: '2026-05-05',
      ref: 'GP-2026-04-001',
      collectedAt: '2026-05-06',
    },
    // April 2026 — on time
    {
      taxpayerId: agroKivu.id,
      periodId: 'period-q1-2026',
      taxType: 'CIT',
      amount: 300,
      penalty: 0,
      isLate: false,
      submittedAt: '2026-05-05',
      ref: 'GP-2026-04-002',
      collectedAt: '2026-05-06',
    },
    // March 2026 — late
    {
      taxpayerId: pharmacie.id,
      periodId: 'period-2026-03',
      taxType: 'WHT',
      amount: 100,
      penalty: 10,
      isLate: true,
      submittedAt: '2026-04-22',
      ref: 'GP-2026-03-001',
      collectedAt: '2026-04-23',
    },
    // March 2026 — late
    {
      taxpayerId: agroKivu.id,
      periodId: 'period-2026-03',
      taxType: 'PAYE',
      amount: 150,
      penalty: 15,
      isLate: true,
      submittedAt: '2026-04-22',
      ref: 'GP-2026-03-002',
      collectedAt: '2026-04-23',
    },
  ];

  for (const d of gilbertDeclarations) {
    const rule = globalTaxRules.find((r) => r.taxType === d.taxType)!;
    const decl = await prisma.declaration.upsert({
      where: {
        taxpayerId_taxPeriodId_taxType: {
          taxpayerId: d.taxpayerId,
          taxPeriodId: d.periodId,
          taxType: d.taxType,
        },
      },
      update: {},
      create: {
        taxpayerId: d.taxpayerId,
        taxPeriodId: d.periodId,
        status: 'PAID',
        calculatedTaxAmount: d.amount,
        penaltyAmount: d.penalty,
        isLate: d.isLate,
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

    await prisma.collection.upsert({
      where: { referenceNumber: d.ref },
      update: {},
      create: {
        agentId: gilbert!.id,
        declarationId: decl.id,
        taxpayerId: d.taxpayerId,
        amount: d.amount + d.penalty,
        method: 'CASH',
        referenceNumber: d.ref,
        collectedAt: new Date(d.collectedAt),
      },
    });
  }

  console.log('✓ Gilbert Paluku collections');

  // ---------------------------------------------------------------------------
  // Remittances — bundle Gilbert's March collections into a CONFIRMED remittance
  // ---------------------------------------------------------------------------
  const marchCollections = await prisma.collection.findMany({
    where: {
      agentId: gilbert!.id,
      referenceNumber: { in: ['GP-2026-03-001', 'GP-2026-03-002'] },
    },
  });

  if (marchCollections.length > 0) {
    const marchTotal = marchCollections.reduce(
      (s, c) => s + Number(c.amount),
      0,
    );

    // Confirmed remittance for March
    const existingConfirmed = await prisma.remittance.findFirst({
      where: { agentId: gilbert!.id, status: 'CONFIRMED' },
    });

    if (!existingConfirmed) {
      const officer = await prisma.user.findFirst({
        where: { email: 'jean.mutombo@fisc-nordkivu.cd' },
      });

      const confirmedRemittance = await prisma.remittance.create({
        data: {
          agentId: gilbert!.id,
          status: 'CONFIRMED',
          totalAmount: marchTotal,
          collectionCount: marchCollections.length,
          submittedAt: new Date('2026-04-25'),
          confirmedById: officer!.id,
          confirmedAt: new Date('2026-04-28'),
          collections: { connect: marchCollections.map((c) => ({ id: c.id })) },
        },
      });
      console.log('✓ Confirmed remittance:', confirmedRemittance.id);
    }
  }

  // Open remittance for April collections (agent bundled but not yet submitted)
  const aprilCollections = await prisma.collection.findMany({
    where: {
      agentId: gilbert!.id,
      referenceNumber: { in: ['GP-2026-04-001', 'GP-2026-04-002'] },
      remittanceId: null,
    },
  });

  if (aprilCollections.length > 0) {
    const aprilTotal = aprilCollections.reduce(
      (s, c) => s + Number(c.amount),
      0,
    );

    const existingOpen = await prisma.remittance.findFirst({
      where: { agentId: gilbert!.id, status: { in: ['OPEN', 'SUBMITTED'] } },
    });

    if (!existingOpen) {
      const submittedRemittance = await prisma.remittance.create({
        data: {
          agentId: gilbert!.id,
          status: 'SUBMITTED',
          totalAmount: aprilTotal,
          collectionCount: aprilCollections.length,
          submittedAt: new Date('2026-05-08'),
          collections: { connect: aprilCollections.map((c) => ({ id: c.id })) },
        },
      });
      console.log('✓ Submitted remittance:', submittedRemittance.id);
    }
  }

  console.log('✓ Gilbert Paluku remittances');
  console.log('\nSeed complete. Default password: Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
