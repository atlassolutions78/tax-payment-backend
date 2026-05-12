import { IsString, IsNotEmpty, IsIn } from 'class-validator';

const SUPPORTED_TAX_TYPES = ['VAT', 'PAYE', 'WHT', 'CIT', 'TOT'];

export class CreateDeclarationDto {
  @IsString()
  @IsNotEmpty()
  taxPeriodId: string;

  @IsString()
  @IsIn(SUPPORTED_TAX_TYPES, {
    message: `taxType must be one of: ${SUPPORTED_TAX_TYPES.join(', ')}`,
  })
  taxType: string;
}
