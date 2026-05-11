import { Module } from '@nestjs/common';
import { DeclarationsController } from './declarations.controller';
import { DeclarationsService } from './declarations.service';
import { DeclarationsRepository } from './declarations.repository';
import { TaxpayersModule } from '../taxpayers/taxpayers.module';
import { TaxEngineModule } from '../tax-engine/tax-engine.module';

@Module({
  imports: [TaxpayersModule, TaxEngineModule],
  controllers: [DeclarationsController],
  providers: [DeclarationsService, DeclarationsRepository],
  exports: [DeclarationsRepository],
})
export class DeclarationsModule {}
