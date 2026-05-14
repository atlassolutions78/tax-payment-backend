import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryRevenueReportDto {
  @IsOptional()
  @IsUUID()
  taxPeriodId?: string;

  @IsOptional()
  @IsString()
  taxType?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class ExportRevenueReportDto {
  @IsOptional()
  @IsUUID()
  taxPeriodId?: string;

  @IsOptional()
  @IsString()
  taxType?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsIn(['csv'])
  format?: 'csv';
}
