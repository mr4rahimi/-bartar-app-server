import { IsInt, IsOptional } from 'class-validator';

export class PreviewBasePriceDto {
  @IsInt()
  serviceId: number;

  @IsInt()
  brandId: number;

  @IsOptional()
  @IsInt()
  modelId?: number;

  @IsOptional()
  @IsInt()
  problemId?: number;
}
