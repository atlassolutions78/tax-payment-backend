import { Module } from '@nestjs/common';
import { TaxRulesRepository } from './tax-rules.repository';
import { TaxPeriodsRepository } from './tax-periods.repository';

@Module({
  providers: [TaxRulesRepository, TaxPeriodsRepository],
  exports: [TaxRulesRepository, TaxPeriodsRepository],
})
export class TaxEngineModule {}
