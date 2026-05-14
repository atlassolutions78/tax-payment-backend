import { IsNotEmpty, IsString } from 'class-validator';

export class DisputeRemittanceDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}
