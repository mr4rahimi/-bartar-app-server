import { IsEnum, IsString, MinLength } from 'class-validator';

export enum DevicePlatformDto {
  android = 'android',
  ios = 'ios',
  web = 'web',
}

export class RegisterDeviceDto {
  @IsString()
  @MinLength(10)
  token: string;

  @IsEnum(DevicePlatformDto)
  platform: DevicePlatformDto;
}
