import { IsOptional, IsIn, IsNumberString, IsUUID } from 'class-validator';

export class QueryComplianceDto {
  @IsOptional()
  @IsIn(['COMPLIANT', 'NON_FILER', 'OUTSTANDING', 'UNDER_REVIEW'])
  status?: string;

  @IsOptional()
  @IsUUID()
  taxPeriodId?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
