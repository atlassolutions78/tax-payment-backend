import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // TIN for taxpayers, email for everyone else

  @IsString()
  @IsNotEmpty()
  password: string;
}
