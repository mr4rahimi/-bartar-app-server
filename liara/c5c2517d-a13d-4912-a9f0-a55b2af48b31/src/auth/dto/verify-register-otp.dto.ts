import { IsOptional, IsString } from 'class-validator';

export class VerifyRegisterOtpDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  password: string;
}
