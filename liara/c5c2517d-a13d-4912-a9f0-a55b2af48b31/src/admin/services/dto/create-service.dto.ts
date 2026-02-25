import { IsString, IsOptional } from 'class-validator';

export class CreateServiceDto {
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
}
