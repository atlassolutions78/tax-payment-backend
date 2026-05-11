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
  // Sectors reflect North Kivu's economy: mining, agriculture, trade, hospitality
  // ---------------------------------------------------------------------------
  const taxpayerData = [
    {
      tin: 'NK-2021-00123',
      businessName: 'Société Minière du Kivu SARL',
      sector: 'MINING',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2019-00456',
      businessName: 'Gorilla Gold Mining SARL',
      sector: 'MINING',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2020-00789',
      businessName: 'Coopérative Caféiculteurs du Kivu',
      sector: 'AGRICULTURE',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2018-01011',
      businessName: 'Grands Lacs Commerce SARL',
      sector: 'COMMERCE',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2022-01213',
      businessName: 'Virunga Trading Company SARL',
      sector: 'COMMERCE',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2017-01415',
      businessName: 'Hôtel Karibu Goma',
      sector: 'HOSPITALITY',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2023-01617',
      businessName: 'Trans-Kivu Transport SARL',
      sector: 'TRANSPORT',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2020-01819',
      businessName: 'Bâtisseurs du Kivu SARL',
      sector: 'CONSTRUCTION',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2021-02021',
      businessName: 'Kivu Digital Services SARL',
      sector: 'SERVICES',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2016-02223',
      businessName: 'Pharmacie Heal Congo SARL',
      sector: 'HEALTH',
      status: 'ACTIVE',
    },
    {
      tin: 'NK-2019-02425',
      businessName: 'Imprimerie Virunga SARL',
      sector: 'SERVICES',
      status: 'INACTIVE',
    },
    {
      tin: 'NK-2022-02627',
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
  const q1Period = await prisma.taxPeriod.create({
    data: {
      id: 'period-q1-2026',
      name: 'Q1 2026 — Janvier à Mars',
      type: 'QUARTERLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      filingDeadline: new Date('2026-04-30'),
      taxTypes: ['PATENTE'],
      isActive: false,
      createdById: officer1.id,
    },
  });

  const q2Period = await prisma.taxPeriod.create({
    data: {
      id: 'period-q2-2026',
      name: 'Q2 2026 — Avril à Juin',
      type: 'QUARTERLY',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      filingDeadline: new Date('2026-07-31'),
      taxTypes: ['PATENTE'],
      isActive: true,
      createdById: officer1.id,
    },
  });

  console.log('✓ Tax periods created');

  // ---------------------------------------------------------------------------
  // Tax Rules — fixed Patente amounts per sector (USD)
  // ---------------------------------------------------------------------------
  const taxAmountBySector: Record<string, number> = {
    MINING: 500,
    AGRICULTURE: 75,
    COMMERCE: 150,
    HOSPITALITY: 250,
    TRANSPORT: 120,
    CONSTRUCTION: 200,
    SERVICES: 100,
    HEALTH: 180,
  };

  const taxRulesData = [
    { sector: 'MINING', name: 'Patente Secteur Minier' },
    { sector: 'AGRICULTURE', name: 'Patente Secteur Agriculture' },
    { sector: 'COMMERCE', name: 'Patente Secteur Commerce' },
    { sector: 'HOSPITALITY', name: 'Patente Secteur Hôtellerie' },
    { sector: 'TRANSPORT', name: 'Patente Secteur Transport' },
    { sector: 'CONSTRUCTION', name: 'Patente Secteur Construction' },
    { sector: 'SERVICES', name: 'Patente Secteur Services' },
    { sector: 'HEALTH', name: 'Patente Secteur Santé' },
  ];

  for (const r of taxRulesData) {
    await prisma.taxRule.create({
      data: {
        id: `rule-${r.sector.toLowerCase()}`,
        taxType: 'PATENTE',
        name: r.name,
        condition: { sector: r.sector },
        flatAmount: taxAmountBySector[r.sector],
        applicableFrom: new Date('2026-01-01'),
        priority: 1,
        isActive: true,
        createdById: officer1.id,
        taxPeriodId: q1Period.id,
      },
    });
  }

  console.log('✓ Tax rules created');

  // ---------------------------------------------------------------------------
  // Q1 Declarations — active taxpayers only
  // 8 SUBMITTED, 2 DRAFT (Kivu Digital + Agro-Kivu)
  // ---------------------------------------------------------------------------
  const activeTaxpayers = taxpayers.filter(
    (tp) => taxpayerData.find((t) => t.tin === tp.tin)!.status === 'ACTIVE',
  );

  const submittedDeclarations: Array<{ id: string; taxpayerId: string }> = [];

  for (let i = 0; i < 8; i++) {
    const tp = activeTaxpayers[i];
    const sector = taxpayerData.find((t) => t.tin === tp.tin)!.sector;
    const decl = await prisma.declaration.create({
      data: {
        taxpayerId: tp.id,
        taxPeriodId: q1Period.id,
        status: 'SUBMITTED',
        calculatedTaxAmount: taxAmountBySector[sector],
        taxBreakdown: {
          rule: `Patente ${sector}`,
          amount: taxAmountBySector[sector],
          currency: 'USD',
        },
        supportingDocuments: [],
        submittedAt: new Date(`2026-04-${String(10 + i).padStart(2, '0')}`),
      },
    });
    submittedDeclarations.push({ id: decl.id, taxpayerId: decl.taxpayerId });
  }

  for (const tp of activeTaxpayers.slice(8)) {
    const sector = taxpayerData.find((t) => t.tin === tp.tin)!.sector;
    await prisma.declaration.create({
      data: {
        taxpayerId: tp.id,
        taxPeriodId: q1Period.id,
        status: 'DRAFT',
        calculatedTaxAmount: taxAmountBySector[sector],
        taxBreakdown: {
          rule: `Patente ${sector}`,
          amount: taxAmountBySector[sector],
          currency: 'USD',
        },
        supportingDocuments: [],
      },
    });
  }

  console.log('✓ Q1 declarations created');

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
  // 2 remain OUTSTANDING (submittedDeclarations[6] and [7])
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
    const sector = taxpayerData.find(
      (t) => taxpayers.find((tp) => tp.id === decl.taxpayerId)?.tin === t.tin,
    )!.sector;
    const amount = taxAmountBySector[sector];
    const col = await prisma.collection.create({
      data: {
        agentId: c.agent.id,
        declarationId: decl.id,
        taxpayerId: decl.taxpayerId,
        amount,
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
      amount,
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

  for (const tp of activeTaxpayers.slice(8)) {
    await prisma.complianceRecord.create({
      data: {
        taxpayerId: tp.id,
        taxPeriodId: q1Period.id,
        status: 'NON_FILER',
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
    const sector = taxpayerData.find((t) => t.tin === tp.tin)!.sector;
    await prisma.declaration.create({
      data: {
        taxpayerId: tp.id,
        taxPeriodId: q2Period.id,
        status: 'SUBMITTED',
        calculatedTaxAmount: taxAmountBySector[sector],
        taxBreakdown: {
          rule: `Patente ${sector}`,
          amount: taxAmountBySector[sector],
          currency: 'USD',
        },
        supportingDocuments: [],
        submittedAt: new Date('2026-05-05'),
      },
    });
  }

  console.log('✓ Q2 early declarations created');
  console.log('\nSeed complete.');
  console.log('  Default password for all accounts: Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
