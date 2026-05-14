import { Module } from '@nestjs/common';
import { GovernmentController } from './government.controller';
import { GovernmentService } from './government.service';
import { TaxpayersModule } from '../taxpayers/taxpayers.module';
import { DeclarationsModule } from '../declarations/declarations.module';
import { CollectionsModule } from '../collections/collections.module';
import { RemittancesModule } from '../remittances/remittances.module';
import { AgentsRepository } from './agents.repository';
import { ReportsRepository } from './reports.repository';

@Module({
  imports: [TaxpayersModule, DeclarationsModule, CollectionsModule, RemittancesModule],
  controllers: [GovernmentController],
  providers: [GovernmentService, AgentsRepository, ReportsRepository],
})
export class GovernmentModule {}
