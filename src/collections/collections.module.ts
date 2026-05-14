import { Module } from '@nestjs/common';
import { CollectionsRepository } from './collections.repository';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { TaxpayersModule } from '../taxpayers/taxpayers.module';

@Module({
  imports: [TaxpayersModule],
  controllers: [CollectionsController],
  providers: [CollectionsRepository, CollectionsService],
  exports: [CollectionsRepository],
})
export class CollectionsModule {}
