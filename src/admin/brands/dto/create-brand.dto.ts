import { IsString, IsOptional, IsArray, ArrayUnique, ArrayNotEmpty } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  serviceIds?: number[]; 
}
