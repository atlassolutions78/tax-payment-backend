import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SUPPORTED_TAX_TYPES = ['VAT', 'PAYE', 'WHT', 'CIT', 'TOT'];

@Injectable()
export class TaxPeriodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.taxPeriod.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.taxPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  findActive() {
    return this.prisma.taxPeriod.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });
  }

  findByYearMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    return this.prisma.taxPeriod.findFirst({ where: { startDate } });
  }

  createMonthly(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month
    const filingDeadline = new Date(year, month, 15); // 15th of following month
    const monthName = startDate.toLocaleString('en-US', { month: 'long' });

    return this.prisma.taxPeriod.create({
      data: {
        name: `${monthName} ${year}`,
        type: 'MONTHLY',
        startDate,
        endDate,
        filingDeadline,
        taxTypes: SUPPORTED_TAX_TYPES,
        isActive: true,
      },
    });
  }

  closeExpired() {
    return this.prisma.taxPeriod.updateMany({
      where: {
        isActive: true,
        filingDeadline: { lt: new Date() },
      },
      data: { isActive: false },
    });
  }
}
