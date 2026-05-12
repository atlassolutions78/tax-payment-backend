import { IsOptional, IsNumberString } from 'class-validator';

export class QueryCollectionsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
