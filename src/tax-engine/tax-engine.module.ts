import { Module } from '@nestjs/common';
import { TaxRulesRepository } from './tax-rules.repository';
import { TaxPeriodsRepository } from './tax-periods.repository';
import { TaxEngineService } from './tax-engine.service';
import { TaxEngineController } from './tax-engine.controller';

@Module({
  controllers: [TaxEngineController],
  providers: [TaxRulesRepository, TaxPeriodsRepository, TaxEngineService],
  exports: [TaxRulesRepository, TaxPeriodsRepository],
})
export class TaxEngineModule {}
