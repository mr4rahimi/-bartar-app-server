import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateModelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsInt()
  brandId: number;

  @IsOptional()
  @IsInt()
  serviceId?: number;
}
