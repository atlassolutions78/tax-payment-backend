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

  findByTaxpayer(taxpayerId: string) {
    return this.prisma.declaration.findMany({
      where: { taxpayerId },
      include: withPeriod,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByTaxpayerAndPeriod(taxpayerId: string, taxPeriodId: string) {
    return this.prisma.declaration.findUnique({
      where: { taxpayerId_taxPeriodId: { taxpayerId, taxPeriodId } },
    });
  }

  create(data: {
    taxpayerId: string;
    taxPeriodId: string;
    calculatedTaxAmount: Prisma.Decimal;
    taxBreakdown: object;
  }) {
    return this.prisma.declaration.create({
      data: {
        taxpayerId: data.taxpayerId,
        taxPeriodId: data.taxPeriodId,
        calculatedTaxAmount: data.calculatedTaxAmount,
        taxBreakdown: data.taxBreakdown,
      },
      include: withPeriod,
    });
  }

  submit(id: string) {
    return this.prisma.declaration.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      include: withPeriod,
    });
  }
}
