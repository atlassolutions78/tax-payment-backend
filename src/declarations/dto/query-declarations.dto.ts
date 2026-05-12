import { IsOptional, IsIn, IsNumberString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

const SUPPORTED_TAX_TYPES = ['VAT', 'PAYE', 'WHT', 'CIT', 'TOT'];

export class QueryDeclarationsDto {
  @IsOptional()
  @IsIn(['SUBMITTED', 'PAID'])
  status?: string;

  @IsOptional()
  @IsIn(SUPPORTED_TAX_TYPES)
  taxType?: string;

  @IsOptional()
  taxPeriodId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isLate?: boolean;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
