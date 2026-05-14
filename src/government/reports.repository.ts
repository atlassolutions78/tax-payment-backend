import { Injectable } from '@nestjs/common';
import { ComplianceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueSummary(filters: { taxPeriodId?: string; taxType?: string; sector?: string }) {
    const declarationWhere = {
      status: 'PAID' as const,
      ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
      ...(filters.taxType && { taxType: filters.taxType }),
      ...(filters.sector && { taxpayer: { sector: filters.sector } }),
    };

    const [totalResult, byTaxType, byPeriodRaw, collectionsForSector] = await Promise.all([
      this.prisma.collection.aggregate({
        where: { declaration: declarationWhere },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.declaration.groupBy({
        by: ['taxType'],
        where: declarationWhere,
        _sum: { calculatedTaxAmount: true, penaltyAmount: true },
        _count: { _all: true },
        orderBy: { _sum: { calculatedTaxAmount: 'desc' } },
      }),
      this.prisma.declaration.groupBy({
        by: ['taxPeriodId'],
        where: declarationWhere,
        _sum: { calculatedTaxAmount: true, penaltyAmount: true },
        _count: { _all: true },
      }),
      this.prisma.collection.findMany({
        where: { declaration: declarationWhere },
        select: { amount: true, taxpayer: { select: { sector: true } } },
      }),
    ]);

    // Aggregate by sector in application code
    const sectorMap = new Map<string, { total: number; count: number }>();
    for (const c of collectionsForSector) {
      const sector = c.taxpayer.sector;
      const prev = sectorMap.get(sector) ?? { total: 0, count: 0 };
      sectorMap.set(sector, { total: prev.total + Number(c.amount), count: prev.count + 1 });
    }
    const bySector = [...sectorMap.entries()]
      .map(([sector, v]) => ({ sector, ...v }))
      .sort((a, b) => b.total - a.total);

    // Fetch period names
    const periodIds = byPeriodRaw.map((p) => p.taxPeriodId);
    const periods = await this.prisma.taxPeriod.findMany({
      where: { id: { in: periodIds } },
      select: { id: true, name: true },
    });
    const periodMap = new Map(periods.map((p) => [p.id, p.name]));

    const byPeriod = byPeriodRaw.map((r) => ({
      periodId: r.taxPeriodId,
      periodName: periodMap.get(r.taxPeriodId) ?? '',
      total: Number(r._sum.calculatedTaxAmount ?? 0) + Number(r._sum.penaltyAmount ?? 0),
      count: r._count._all,
    }));

    return {
      totalRevenue: totalResult._sum.amount ?? 0,
      totalCollections: totalResult._count,
      byTaxType: byTaxType.map((r) => ({
        taxType: r.taxType,
        total: Number(r._sum.calculatedTaxAmount ?? 0) + Number(r._sum.penaltyAmount ?? 0),
        count: r._count._all,
      })),
      bySector,
      byPeriod,
    };
  }

  async getRevenueCollections(
    filters: { taxPeriodId?: string; taxType?: string; sector?: string },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      declaration: {
        status: 'PAID' as const,
        ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
        ...(filters.taxType && { taxType: filters.taxType }),
      },
      ...(filters.sector && { taxpayer: { sector: filters.sector } }),
    };

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: {
          taxpayer: { select: { businessName: true, tin: true, sector: true } },
          declaration: {
            select: { taxType: true, penaltyAmount: true, taxPeriod: { select: { name: true } } },
          },
          agent: { include: { user: { select: { name: true } } } },
        },
        orderBy: { collectedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.collection.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getComplianceSummary(filters: { taxPeriodId?: string }) {
    const where = {
      ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
    };

    const [byStatus, total] = await Promise.all([
      this.prisma.complianceRecord.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.complianceRecord.count({ where }),
    ]);

    return {
      total,
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async getComplianceRecords(
    filters: { status?: ComplianceStatus; taxPeriodId?: string },
    pagination: { page: number; limit: number },
  ) {
    const where = {
      ...(filters.status && { status: filters.status }),
      ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
    };

    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.complianceRecord.findMany({
        where,
        include: {
          taxpayer: { select: { businessName: true, tin: true, sector: true } },
          taxPeriod: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.complianceRecord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // Fetch all records for CSV (no pagination)
  async getAllRevenueCollectionsForExport(filters: {
    taxPeriodId?: string;
    taxType?: string;
    sector?: string;
  }) {
    return this.prisma.collection.findMany({
      where: {
        declaration: {
          status: 'PAID' as const,
          ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
          ...(filters.taxType && { taxType: filters.taxType }),
        },
        ...(filters.sector && { taxpayer: { sector: filters.sector } }),
      },
      include: {
        taxpayer: { select: { businessName: true, tin: true, sector: true } },
        declaration: {
          select: { taxType: true, penaltyAmount: true, taxPeriod: { select: { name: true } } },
        },
        agent: { include: { user: { select: { name: true } } } },
      },
      orderBy: { collectedAt: 'desc' },
    });
  }

  async getAllComplianceRecordsForExport(filters: {
    status?: ComplianceStatus;
    taxPeriodId?: string;
  }) {
    return this.prisma.complianceRecord.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.taxPeriodId && { taxPeriodId: filters.taxPeriodId }),
      },
      include: {
        taxpayer: { select: { businessName: true, tin: true, sector: true } },
        taxPeriod: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
