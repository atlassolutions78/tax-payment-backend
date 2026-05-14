import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RemittanceStatus } from '@prisma/client';

export class QueryRemittancesDto {
  @IsOptional()
  @IsEnum(RemittanceStatus)
  status?: RemittanceStatus;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
