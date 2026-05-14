import { IsOptional, IsBoolean, IsString, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAgentsDto {
  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === 'true'))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
