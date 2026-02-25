import { IsInt, IsOptional, Min } from 'class-validator';

export class CreatePartPriceDto {
  @IsInt()
  serviceId: number;

  @IsOptional()
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsInt()
  modelId?: number;

  @IsInt()
  partId: number;

  @IsInt()
  @Min(0)
  price: number;

  // قیمت های‌کپی (اختیاری)
  @IsOptional()
  @IsInt()
  @Min(0)
  highCopyPrice?: number;

  // قیمت کپی (اختیاری)
  @IsOptional()
  @IsInt()
  @Min(0)
  copyPrice?: number;

}
