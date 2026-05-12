import { Module } from '@nestjs/common';
import { TaxEngineModule } from '../tax-engine/tax-engine.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [TaxEngineModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
