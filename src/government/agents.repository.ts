import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: { zone?: string; isActive?: boolean },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      ...(filters.zone && { assignedZone: { contains: filters.zone, mode: 'insensitive' as const } }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.agent.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async getSummary(id: string) {
    const [totalCollections, totalAmountResult, pendingRemittances] = await Promise.all([
      this.prisma.collection.count({ where: { agentId: id } }),
      this.prisma.collection.aggregate({
        where: { agentId: id },
        _sum: { amount: true },
      }),
      this.prisma.remittance.count({ where: { agentId: id, status: { in: ['OPEN', 'SUBMITTED'] } } }),
    ]);

    return {
      totalCollections,
      totalAmountCollected: totalAmountResult._sum.amount ?? 0,
      pendingRemittances,
    };
  }

  updateZone(id: string, zone: string) {
    return this.prisma.agent.update({
      where: { id },
      data: { assignedZone: zone },
      include: { user: { select: { name: true, email: true } } },
    });
  }
}
