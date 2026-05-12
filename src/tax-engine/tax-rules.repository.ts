import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveTaxTypes(): Promise<string[]> {
    const rules = await this.prisma.taxRule.findMany({
      where: { isActive: true },
      select: { taxType: true },
      distinct: ['taxType'],
    });
    return rules.map((r) => r.taxType);
  }

  findForDeclaration(taxType: string, sector: string) {
    if (taxType === 'PATENTE') {
      return this.prisma.taxRule.findFirst({
        where: {
          isActive: true,
          taxType,
          condition: { path: ['sector'], equals: sector },
        },
        orderBy: { priority: 'desc' },
      });
    }
    return this.prisma.taxRule.findFirst({
      where: { isActive: true, taxType },
      orderBy: { priority: 'desc' },
    });
  }
}
