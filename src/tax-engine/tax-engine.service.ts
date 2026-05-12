import { Injectable } from '@nestjs/common';
import { TaxRulesRepository } from './tax-rules.repository';
import { TaxPeriodsRepository } from './tax-periods.repository';

@Injectable()
export class TaxEngineService {
  constructor(
    private readonly taxRulesRepository: TaxRulesRepository,
    private readonly taxPeriodsRepository: TaxPeriodsRepository,
  ) {}

  getTaxTypes() {
    return this.taxRulesRepository.findActiveTaxTypes();
  }

  getTaxPeriods() {
    return this.taxPeriodsRepository.findAll();
  }
}
