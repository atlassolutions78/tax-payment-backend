import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaxEngineService } from './tax-engine.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TaxEngineController {
  constructor(private readonly taxEngineService: TaxEngineService) {}

  @Get('tax-types')
  getTaxTypes() {
    return this.taxEngineService.getTaxTypes();
  }

  @Get('tax-periods')
  getTaxPeriods() {
    return this.taxEngineService.getTaxPeriods();
  }
}
