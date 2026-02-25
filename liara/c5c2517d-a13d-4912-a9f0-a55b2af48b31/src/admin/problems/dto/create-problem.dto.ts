import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateProblemDto {
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