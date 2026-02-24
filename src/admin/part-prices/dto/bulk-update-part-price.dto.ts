import { IsArray, IsEnum, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export enum PartPriceBulkOperation {
  SET = 'set',
  INCREASE_PERCENT = 'increase_percent',
  INCREASE_AMOUNT = 'increase_amount',
}

export class PartPriceBulkUpdateDto {
  @IsOptional()
  @IsArray()
  ids?: number[];

  @IsOptional()
  filter?: {
    serviceId?: number;
    brandId?: number;
    modelId?: number;
    partId?: number;
  };

  @IsEnum(PartPriceBulkOperation)
  operation: PartPriceBulkOperation;

  @IsInt()
  @Min(0)
  value: number;
}
