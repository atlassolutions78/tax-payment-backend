import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxPeriodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.taxPeriod.findUnique({ where: { id } });
  }

  findActive() {
    return this.prisma.taxPeriod.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });
  }
}
