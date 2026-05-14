import { Injectable, NotFoundException } from '@nestjs/common';
import { TaxpayersRepository } from '../taxpayers/taxpayers.repository';
import { DeclarationsRepository } from '../declarations/declarations.repository';
import { CollectionsRepository } from '../collections/collections.repository';
import { AgentsRepository } from './agents.repository';
import { ReportsRepository } from './reports.repository';
import { RemittancesService } from '../remittances/remittances.service';
import { QueryTaxpayersDto } from './dto/query-taxpayers.dto';
import { QueryDeclarationsDto } from '../declarations/dto/query-declarations.dto';
import { QueryComplianceDto } from './dto/query-compliance.dto';
import { QueryAgentsDto } from './dto/query-agents.dto';
import { AssignZoneDto } from './dto/assign-zone.dto';
import { QueryRemittancesDto } from '../remittances/dto/query-remittances.dto';
import { DisputeRemittanceDto } from '../remittances/dto/dispute-remittance.dto';
import { QueryRevenueReportDto, ExportRevenueReportDto } from './dto/query-revenue-report.dto';
import { QueryComplianceReportDto, ExportComplianceReportDto } from './dto/query-compliance-report.dto';
import { ComplianceStatus } from '@prisma/client';

@Injectable()
export class GovernmentService {
  constructor(
    private readonly taxpayersRepository: TaxpayersRepository,
    private readonly declarationsRepository: DeclarationsRepository,
    private readonly collectionsRepository: CollectionsRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly remittancesService: RemittancesService,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async getTaxpayers(query: QueryTaxpayersDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 7);

    const result = await this.taxpayersRepository.findAll(
      { search: query.search, sector: query.sector, status: query.status },
      { page, limit },
    );

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getTaxpayerProfile(id: string) {
    const taxpayer = await this.taxpayersRepository.findByIdWithUser(id);
    if (!taxpayer) throw new NotFoundException('Taxpayer not found');
    return taxpayer;
  }

  async getTaxpayerCompliance(id: string, query: QueryComplianceDto) {
    const taxpayer = await this.taxpayersRepository.findById(id);
    if (!taxpayer) throw new NotFoundException('Taxpayer not found');

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const result = await this.taxpayersRepository.findComplianceRecords(
      id,
      { status: query.status, taxPeriodId: query.taxPeriodId },
      { page, limit },
    );

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getTaxpayerDeclarations(id: string, query: QueryDeclarationsDto) {
    const taxpayer = await this.taxpayersRepository.findById(id);
    if (!taxpayer) throw new NotFoundException('Taxpayer not found');

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const result = await this.declarationsRepository.findByTaxpayer(
      id,
      { status: query.status, taxType: query.taxType, taxPeriodId: query.taxPeriodId, isLate: query.isLate },
      { page, limit },
    );

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getTaxpayerCollections(id: string, query: { page?: string; limit?: string }) {
    const taxpayer = await this.taxpayersRepository.findById(id);
    if (!taxpayer) throw new NotFoundException('Taxpayer not found');

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const result = await this.collectionsRepository.findByTaxpayer(id, { page, limit });

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getAgents(query: QueryAgentsDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const result = await this.agentsRepository.findAll(
      { zone: query.zone, isActive: query.isActive },
      { page, limit },
    );

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getAgentProfile(id: string) {
    const agent = await this.agentsRepository.findById(id);
    if (!agent) throw new NotFoundException('Agent not found');

    const summary = await this.agentsRepository.getSummary(id);
    return { ...agent, summary };
  }

  async assignZone(id: string, dto: AssignZoneDto) {
    const agent = await this.agentsRepository.findById(id);
    if (!agent) throw new NotFoundException('Agent not found');

    return this.agentsRepository.updateZone(id, dto.zone);
  }

  async getAgentCollections(id: string, query: { page?: string; limit?: string }) {
    const agent = await this.agentsRepository.findById(id);
    if (!agent) throw new NotFoundException('Agent not found');

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const result = await this.collectionsRepository.findByAgent(id, { page, limit });

    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  getAllRemittances(query: QueryRemittancesDto) {
    return this.remittancesService.getAllRemittances(query);
  }

  getRemittanceById(id: string) {
    return this.remittancesService.getRemittanceById(id);
  }

  confirmRemittance(id: string, officerId: string) {
    return this.remittancesService.confirmRemittance(id, officerId);
  }

  disputeRemittance(id: string, dto: DisputeRemittanceDto) {
    return this.remittancesService.disputeRemittance(id, dto);
  }

  getRemittancesSummary() {
    return this.remittancesService.getSummary();
  }

  async getRevenueReport(query: QueryRevenueReportDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const filters = { taxPeriodId: query.taxPeriodId, taxType: query.taxType, sector: query.sector };

    const [summary, collections] = await Promise.all([
      this.reportsRepository.getRevenueSummary(filters),
      this.reportsRepository.getRevenueCollections(filters, { page, limit }),
    ]);

    return {
      summary,
      data: collections.data,
      meta: {
        total: collections.total,
        page: collections.page,
        limit: collections.limit,
        totalPages: Math.ceil(collections.total / collections.limit),
      },
    };
  }

  async exportRevenueCsv(query: ExportRevenueReportDto): Promise<string> {
    const filters = { taxPeriodId: query.taxPeriodId, taxType: query.taxType, sector: query.sector };
    const records = await this.reportsRepository.getAllRevenueCollectionsForExport(filters);

    const header = 'Reference,Taxpayer,TIN,Sector,Tax Type,Period,Amount,Penalty,Total,Collected At,Agent';
    const rows = records.map((c) => {
      const penalty = Number(c.declaration.penaltyAmount);
      const amount = Number(c.amount) - penalty;
      return [
        c.referenceNumber,
        `"${c.taxpayer.businessName}"`,
        c.taxpayer.tin,
        `"${c.taxpayer.sector}"`,
        c.declaration.taxType,
        `"${c.declaration.taxPeriod.name}"`,
        amount.toFixed(2),
        penalty.toFixed(2),
        Number(c.amount).toFixed(2),
        c.collectedAt.toISOString().split('T')[0],
        `"${c.agent.user.name}"`,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async getComplianceReport(query: QueryComplianceReportDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const filters = { status: query.status, taxPeriodId: query.taxPeriodId };

    const [summary, records] = await Promise.all([
      this.reportsRepository.getComplianceSummary({ taxPeriodId: query.taxPeriodId }),
      this.reportsRepository.getComplianceRecords(filters, { page, limit }),
    ]);

    return {
      summary,
      data: records.data,
      meta: {
        total: records.total,
        page: records.page,
        limit: records.limit,
        totalPages: Math.ceil(records.total / records.limit),
      },
    };
  }

  async exportComplianceCsv(query: ExportComplianceReportDto): Promise<string> {
    const filters = { status: query.status as ComplianceStatus | undefined, taxPeriodId: query.taxPeriodId };
    const records = await this.reportsRepository.getAllComplianceRecordsForExport(filters);

    const header = 'Taxpayer,TIN,Sector,Period,Status,Flagged At,Note';
    const rows = records.map((r) =>
      [
        `"${r.taxpayer.businessName}"`,
        r.taxpayer.tin,
        `"${r.taxpayer.sector}"`,
        `"${r.taxPeriod.name}"`,
        r.status,
        r.flaggedAt ? r.flaggedAt.toISOString().split('T')[0] : '',
        r.note ? `"${r.note}"` : '',
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
