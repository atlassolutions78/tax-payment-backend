import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DeclarationsRepository } from './declarations.repository';
import { TaxpayersRepository } from '../taxpayers/taxpayers.repository';
import { TaxRulesRepository } from '../tax-engine/tax-rules.repository';
import { TaxPeriodsRepository } from '../tax-engine/tax-periods.repository';
import { CreateDeclarationDto } from './dto/create-declaration.dto';
import { QueryDeclarationsDto } from './dto/query-declarations.dto';

function withTotals<T extends { calculatedTaxAmount: unknown; penaltyAmount: unknown }>(
  declaration: T,
) {
  const tax = Number(declaration.calculatedTaxAmount ?? 0);
  const penalty = Number(declaration.penaltyAmount ?? 0);
  return {
    ...declaration,
    totalAmount: +(tax + penalty).toFixed(2),
  };
}

@Injectable()
export class DeclarationsService {
  constructor(
    private readonly declarationsRepository: DeclarationsRepository,
    private readonly taxpayersRepository: TaxpayersRepository,
    private readonly taxRulesRepository: TaxRulesRepository,
    private readonly taxPeriodsRepository: TaxPeriodsRepository,
  ) {}

  async getMyDeclarations(taxpayerId: string, query: QueryDeclarationsDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const result = await this.declarationsRepository.findByTaxpayer(
      taxpayerId,
      { status: query.status, taxType: query.taxType, taxPeriodId: query.taxPeriodId, isLate: query.isLate },
      { page, limit },
    );

    return {
      data: result.data.map(withTotals),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getMyDeclaration(taxpayerId: string, id: string) {
    const declaration = await this.declarationsRepository.findById(id);
    if (!declaration) throw new NotFoundException('Declaration not found');
    if (declaration.taxpayerId !== taxpayerId) throw new ForbiddenException();
    return withTotals(declaration);
  }

  async createDeclaration(taxpayerId: string, dto: CreateDeclarationDto) {
    const [taxpayer, period, existing] = await Promise.all([
      this.taxpayersRepository.findById(taxpayerId),
      this.taxPeriodsRepository.findById(dto.taxPeriodId),
      this.declarationsRepository.findByTaxpayerAndPeriod(taxpayerId, dto.taxPeriodId, dto.taxType),
    ]);

    if (!taxpayer) throw new NotFoundException('Taxpayer not found');
    if (!period) throw new NotFoundException('Tax period not found');
    if (existing)
      throw new ConflictException(`A ${dto.taxType} declaration already exists for this period`);

    const rule = await this.taxRulesRepository.findForDeclaration(dto.taxType, taxpayer.sector);
    if (!rule?.flatAmount)
      throw new BadRequestException(`No active tax rule found for ${dto.taxType}`);

    const isLate = period.filingDeadline < new Date();
    const penaltyAmount = isLate
      ? Number(rule.flatAmount) * Number(rule.penaltyRate)
      : 0;

    const declaration = await this.declarationsRepository.create({
      taxpayerId,
      taxPeriodId: dto.taxPeriodId,
      taxType: dto.taxType,
      calculatedTaxAmount: rule.flatAmount,
      penaltyAmount,
      isLate,
      taxBreakdown: {
        rule: rule.name,
        taxType: rule.taxType,
        sector: taxpayer.sector,
        flatAmount: rule.flatAmount,
        penaltyRate: Number(rule.penaltyRate),
      },
    });

    return withTotals(declaration);
  }
}
