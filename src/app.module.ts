import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DeclarationsModule } from './declarations/declarations.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CollectionsModule } from './collections/collections.module';
import { RemittancesModule } from './remittances/remittances.module';
import { GovernmentModule } from './government/government.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DeclarationsModule,
    SchedulerModule,
    CollectionsModule,
    RemittancesModule,
    GovernmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
