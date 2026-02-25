import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  serviceId: number;

  @IsInt()
  brandId: number;

  @IsOptional()
  @IsInt()
  modelId?: number;

  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  @IsNotEmpty()
  issue: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  pickupMethod: string;

  @IsOptional()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @Min(0)
  finalPrice?: number;

  @IsOptional()
  @IsInt()
  problemId?: number;
}
