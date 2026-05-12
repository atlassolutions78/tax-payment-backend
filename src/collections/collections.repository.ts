import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const withDetails = {
  declaration: { include: { taxPeriod: true } },
  agent: { include: { user: true } },
} as const;

@Injectable()
export class CollectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTaxpayer(taxpayerId: string, pagination: { page: number; limit: number }) {
    const where = { taxpayerId };
    const [data, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: withDetails,
        orderBy: { collectedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.collection.count({ where }),
    ]);
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  findByIdAndTaxpayer(id: string, taxpayerId: string) {
    return this.prisma.collection.findFirst({
      where: { id, taxpayerId },
      include: withDetails,
    });
  }
}
