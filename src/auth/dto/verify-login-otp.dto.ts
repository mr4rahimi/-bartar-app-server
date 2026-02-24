import { IsString } from 'class-validator';

export class VerifyLoginOtpDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}
