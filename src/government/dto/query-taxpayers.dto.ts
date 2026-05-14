import { IsOptional, IsIn, IsNumberString, IsString } from 'class-validator';

const SECTORS = ['MINING', 'AGRICULTURE', 'COMMERCE', 'HOSPITALITY', 'TRANSPORT', 'CONSTRUCTION', 'SERVICES', 'HEALTH'];

export class QueryTaxpayersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(SECTORS)
  sector?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
