import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeclarationDto {
  @IsString()
  @IsNotEmpty()
  taxPeriodId: string;
}
