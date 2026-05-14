import { Injectable } from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const withDetails = {
  collections: {
    include: {
      declaration: { include: { taxPeriod: true } },
      taxpayer: { select: { businessName: true, tin: true } },
    },
  },
  agent: { include: { user: { select: { name: true, email: true } } } },
  confirmedBy: { select: { name: true, email: true } },
} as const;

@Injectable()
export class RemittancesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUnlinkedCollections(agentId: string) {
    return this.prisma.collection.findMany({
      where: { agentId, remittanceId: null },
    });
  }

  async create(agentId: string, collectionIds: string[], totalAmount: number) {
    return this.prisma.remittance.create({
      data: {
        agentId,
        totalAmount,
        collectionCount: collectionIds.length,
        collections: { connect: collectionIds.map((id) => ({ id })) },
      },
      include: withDetails,
    });
  }

  findById(id: string) {
    return this.prisma.remittance.findUnique({ where: { id }, include: withDetails });
  }

  async findByAgent(agentId: string, pagination: { page: number; limit: number }) {
    const where = { agentId };
    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.remittance.findMany({
        where,
        include: withDetails,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.remittance.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  submit(id: string) {
    return this.prisma.remittance.update({
      where: { id },
      data: { status: RemittanceStatus.SUBMITTED, submittedAt: new Date() },
      include: withDetails,
    });
  }

  confirm(id: string, confirmedById: string) {
    return this.prisma.remittance.update({
      where: { id },
      data: { status: RemittanceStatus.CONFIRMED, confirmedById, confirmedAt: new Date() },
      include: withDetails,
    });
  }

  dispute(id: string, note: string) {
    return this.prisma.remittance.update({
      where: { id },
      data: { status: RemittanceStatus.DISPUTED, note },
      include: withDetails,
    });
  }

  async findAll(
    filters: { status?: RemittanceStatus; agentId?: string },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      ...(filters.status && { status: filters.status }),
      ...(filters.agentId && { agentId: filters.agentId }),
    };
    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.remittance.findMany({
        where,
        include: withDetails,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.remittance.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getSummary() {
    const [totalCollected, confirmed, pending, unremitted] = await Promise.all([
      this.prisma.collection.aggregate({ _sum: { amount: true }, _count: true }),
      this.prisma.remittance.aggregate({
        where: { status: RemittanceStatus.CONFIRMED },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.remittance.aggregate({
        where: { status: { in: [RemittanceStatus.OPEN, RemittanceStatus.SUBMITTED] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.collection.aggregate({
        where: { remittanceId: null },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalCollected: totalCollected._sum.amount ?? 0,
      totalCollections: totalCollected._count,
      totalConfirmed: confirmed._sum.totalAmount ?? 0,
      confirmedRemittances: confirmed._count,
      totalPending: pending._sum.totalAmount ?? 0,
      pendingRemittances: pending._count,
      totalUnremitted: unremitted._sum.amount ?? 0,
      unremittedCollections: unremitted._count,
    };
  }
}
