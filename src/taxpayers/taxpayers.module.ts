import { Module } from '@nestjs/common';
import { TaxpayersRepository } from './taxpayers.repository';

@Module({
  providers: [TaxpayersRepository],
  exports: [TaxpayersRepository],
})
export class TaxpayersModule {}
