import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RemittancesRepository } from './remittances.repository';
import { RemittancesService } from './remittances.service';
import { RemittancesController } from './remittances.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RemittancesController],
  providers: [RemittancesService, RemittancesRepository],
  exports: [RemittancesService, RemittancesRepository],
})
export class RemittancesModule {}
