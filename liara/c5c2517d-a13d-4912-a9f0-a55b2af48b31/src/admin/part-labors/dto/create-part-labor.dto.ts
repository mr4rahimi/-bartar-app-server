import { IsInt, IsOptional, Min } from 'class-validator';

export class CreatePartLaborDto {
  @IsInt()
  serviceId: number;

  @IsInt()
  partId: number;

  @IsOptional()
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsInt()
  modelId?: number;

  @IsInt()
  @Min(0)
  laborFee: number;
}
