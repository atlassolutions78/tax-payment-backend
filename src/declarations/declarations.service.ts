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
import { DeclarationStatus } from '@prisma/client';

@Injectable()
export class DeclarationsService {
  constructor(
    private readonly declarationsRepository: DeclarationsRepository,
    private readonly taxpayersRepository: TaxpayersRepository,
    private readonly taxRulesRepository: TaxRulesRepository,
    private readonly taxPeriodsRepository: TaxPeriodsRepository,
  ) {}

  getMyDeclarations(taxpayerId: string) {
    return this.declarationsRepository.findByTaxpayer(taxpayerId);
  }

  async getMyDeclaration(taxpayerId: string, id: string) {
    const declaration = await this.declarationsRepository.findById(id);
    if (!declaration) throw new NotFoundException('Declaration not found');
    if (declaration.taxpayerId !== taxpayerId) throw new ForbiddenException();
    return declaration;
  }

  async createDeclaration(taxpayerId: string, dto: CreateDeclarationDto) {
    const [taxpayer, period, existing] = await Promise.all([
      this.taxpayersRepository.findById(taxpayerId),
      this.taxPeriodsRepository.findById(dto.taxPeriodId),
      this.declarationsRepository.findByTaxpayerAndPeriod(taxpayerId, dto.taxPeriodId),
    ]);

    if (!taxpayer) throw new NotFoundException('Taxpayer not found');
    if (!period || !period.isActive)
      throw new BadRequestException('Tax period not found or no longer active');
    if (existing)
      throw new ConflictException('A declaration already exists for this period');

    const rule = await this.taxRulesRepository.findBySector(taxpayer.sector);
    if (!rule?.flatAmount)
      throw new BadRequestException('No active tax rule found for your sector');

    return this.declarationsRepository.create({
      taxpayerId,
      taxPeriodId: dto.taxPeriodId,
      calculatedTaxAmount: rule.flatAmount,
      taxBreakdown: {
        rule: rule.name,
        taxType: rule.taxType,
        sector: taxpayer.sector,
        flatAmount: rule.flatAmount,
      },
    });
  }

  async submitDeclaration(taxpayerId: string, id: string) {
    const declaration = await this.declarationsRepository.findById(id);
    if (!declaration) throw new NotFoundException('Declaration not found');
    if (declaration.taxpayerId !== taxpayerId) throw new ForbiddenException();
    if (declaration.status === DeclarationStatus.SUBMITTED)
      throw new BadRequestException('Declaration already submitted');

    return this.declarationsRepository.submit(id);
  }
}
