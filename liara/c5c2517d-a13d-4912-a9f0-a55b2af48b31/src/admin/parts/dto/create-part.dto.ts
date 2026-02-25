import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePartDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsInt()
  serviceId: number;

  @IsOptional()
  active?: boolean;
}
