import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const withPeriod = { taxPeriod: true } satisfies Prisma.DeclarationInclude;

@Injectable()
export class DeclarationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.declaration.findUnique({
      where: { id },
      include: withPeriod,
    });
  }

  async findByTaxpayer(
    taxpayerId: string,
    filters: {
      status?: string;
      taxType?: string;
      taxPeriodId?: string;
      isLate?: boolean;
    },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      taxpayerId,
      ...(filters.status && { status: filters.status as never }),
      ...(filters.taxType && { taxType: filters.taxType }),
      ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
      ...(filters.isLate !== undefined && { isLate: filters.isLate }),
    };

    const [data, total] = await Promise.all([
      this.prisma.declaration.findMany({
        where,
        include: withPeriod,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.declaration.count({ where }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  findByTaxpayerAndPeriod(taxpayerId: string, taxPeriodId: string, taxType: string) {
    return this.prisma.declaration.findUnique({
      where: { taxpayerId_taxPeriodId_taxType: { taxpayerId, taxPeriodId, taxType } },
    });
  }

  create(data: {
    taxpayerId: string;
    taxPeriodId: string;
    taxType: string;
    calculatedTaxAmount: Prisma.Decimal;
    penaltyAmount: number;
    isLate: boolean;
    taxBreakdown: object;
  }) {
    return this.prisma.declaration.create({
      data: {
        taxpayerId: data.taxpayerId,
        taxPeriodId: data.taxPeriodId,
        taxType: data.taxType,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        calculatedTaxAmount: data.calculatedTaxAmount,
        penaltyAmount: data.penaltyAmount,
        isLate: data.isLate,
        taxBreakdown: data.taxBreakdown,
      },
      include: withPeriod,
    });
  }
}
