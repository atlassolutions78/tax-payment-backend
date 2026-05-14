import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ComplianceStatus } from '@prisma/client';

export class QueryComplianceReportDto {
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @IsOptional()
  @IsUUID()
  taxPeriodId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class ExportComplianceReportDto {
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @IsOptional()
  @IsUUID()
  taxPeriodId?: string;

  @IsOptional()
  @IsIn(['csv'])
  format?: 'csv';
}
