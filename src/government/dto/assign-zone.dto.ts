import { IsString, IsNotEmpty } from 'class-validator';

export class AssignZoneDto {
  @IsString()
  @IsNotEmpty()
  zone: string;
}
