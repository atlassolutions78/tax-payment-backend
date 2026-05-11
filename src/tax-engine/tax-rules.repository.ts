import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySector(sector: string) {
    return this.prisma.taxRule.findFirst({
      where: {
        isActive: true,
        condition: { path: ['sector'], equals: sector },
      },
      orderBy: { priority: 'desc' },
    });
  }
}
