import { Body, Controller, Get, Header, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { GovernmentService } from './government.service';
import { QueryTaxpayersDto } from './dto/query-taxpayers.dto';
import { QueryDeclarationsDto } from '../declarations/dto/query-declarations.dto';
import { QueryComplianceDto } from './dto/query-compliance.dto';
import { QueryAgentsDto } from './dto/query-agents.dto';
import { AssignZoneDto } from './dto/assign-zone.dto';
import { QueryRemittancesDto } from '../remittances/dto/query-remittances.dto';
import { DisputeRemittanceDto } from '../remittances/dto/dispute-remittance.dto';
import { QueryRevenueReportDto, ExportRevenueReportDto } from './dto/query-revenue-report.dto';
import { QueryComplianceReportDto, ExportComplianceReportDto } from './dto/query-compliance-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GOV_OFFICER, Role.ADMIN)
@Controller('government')
export class GovernmentController {
  constructor(private readonly governmentService: GovernmentService) {}

  @Get('taxpayers')
  getTaxpayers(@Query() query: QueryTaxpayersDto) {
    return this.governmentService.getTaxpayers(query);
  }

  @Get('taxpayers/:id')
  getTaxpayerProfile(@Param('id') id: string) {
    return this.governmentService.getTaxpayerProfile(id);
  }

  @Get('taxpayers/:id/compliance')
  getTaxpayerCompliance(@Param('id') id: string, @Query() query: QueryComplianceDto) {
    return this.governmentService.getTaxpayerCompliance(id, query);
  }

  @Get('taxpayers/:id/declarations')
  getTaxpayerDeclarations(@Param('id') id: string, @Query() query: QueryDeclarationsDto) {
    return this.governmentService.getTaxpayerDeclarations(id, query);
  }

  @Get('taxpayers/:id/collections')
  getTaxpayerCollections(
    @Param('id') id: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.governmentService.getTaxpayerCollections(id, query);
  }

  @Get('agents')
  getAgents(@Query() query: QueryAgentsDto) {
    return this.governmentService.getAgents(query);
  }

  @Get('agents/:id')
  getAgentProfile(@Param('id') id: string) {
    return this.governmentService.getAgentProfile(id);
  }

  @Patch('agents/:id/zone')
  assignZone(@Param('id') id: string, @Body() dto: AssignZoneDto) {
    return this.governmentService.assignZone(id, dto);
  }

  @Get('agents/:id/collections')
  getAgentCollections(
    @Param('id') id: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.governmentService.getAgentCollections(id, query);
  }

  @Get('remittances/summary')
  getRemittancesSummary() {
    return this.governmentService.getRemittancesSummary();
  }

  @Get('remittances')
  getRemittances(@Query() query: QueryRemittancesDto) {
    return this.governmentService.getAllRemittances(query);
  }

  @Get('remittances/:id')
  getRemittance(@Param('id') id: string) {
    return this.governmentService.getRemittanceById(id);
  }

  @Post('remittances/:id/confirm')
  confirmRemittance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.governmentService.confirmRemittance(id, user.sub);
  }

  @Patch('remittances/:id/dispute')
  disputeRemittance(@Param('id') id: string, @Body() dto: DisputeRemittanceDto) {
    return this.governmentService.disputeRemittance(id, dto);
  }

  @Get('reports/revenue')
  getRevenueReport(@Query() query: QueryRevenueReportDto) {
    return this.governmentService.getRevenueReport(query);
  }

  @Get('reports/revenue/export')
  async exportRevenueReport(@Query() query: ExportRevenueReportDto, @Res() res: Response) {
    const csv = await this.governmentService.exportRevenueCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.csv"');
    res.send(csv);
  }

  @Get('reports/compliance')
  getComplianceReport(@Query() query: QueryComplianceReportDto) {
    return this.governmentService.getComplianceReport(query);
  }

  @Get('reports/compliance/export')
  async exportComplianceReport(@Query() query: ExportComplianceReportDto, @Res() res: Response) {
    const csv = await this.governmentService.exportComplianceCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.csv"');
    res.send(csv);
  }
}
