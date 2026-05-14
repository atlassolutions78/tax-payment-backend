import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxpayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTin(tin: string) {
    return this.prisma.taxpayer.findUnique({
      where: { tin },
      include: { user: true },
    });
  }

  findById(id: string) {
    return this.prisma.taxpayer.findUnique({
      where: { id },
    });
  }

  findByIdWithUser(id: string) {
    return this.prisma.taxpayer.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
  }

  async findComplianceRecords(
    taxpayerId: string,
    filters: { status?: string; taxPeriodId?: string },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      taxpayerId,
      ...(filters.status && { status: filters.status as never }),
      ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
    };

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.complianceRecord.findMany({
        where,
        include: { taxPeriod: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.complianceRecord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAll(
    filters: { search?: string; sector?: string; status?: string },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      ...(filters.sector && { sector: filters.sector }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { businessName: { contains: filters.search, mode: 'insensitive' as const } },
          { tin: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.taxpayer.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { businessName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.taxpayer.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
