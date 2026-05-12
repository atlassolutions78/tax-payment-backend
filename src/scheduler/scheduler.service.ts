import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaxPeriodsRepository } from '../tax-engine/tax-periods.repository';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly taxPeriodsRepository: TaxPeriodsRepository) {}

  async onModuleInit() {
    await this.generateCurrentMonthPeriod();
  }

  // Runs at 00:00 on the 1st of every month
  @Cron('0 0 1 * *')
  async generateCurrentMonthPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const existing = await this.taxPeriodsRepository.findByYearMonth(year, month);
    if (existing) return;

    const period = await this.taxPeriodsRepository.createMonthly(year, month);
    this.logger.log(`Created period: ${period.name}`);
  }

  // Runs at 00:01 on the 16th of every month
  @Cron('1 0 16 * *')
  async closeExpiredPeriods() {
    const result = await this.taxPeriodsRepository.closeExpired();
    this.logger.log(`Closed ${result.count} expired period(s)`);
  }
}
