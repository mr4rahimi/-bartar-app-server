import { IsIn, IsOptional, IsString } from 'class-validator';

export class CallLogsDailyReportDto {
  @IsOptional()
  @IsString()
  @IsIn(['7d', '30d', '3m', '1y', 'all'])
  range?: '7d' | '30d' | '3m' | '1y' | 'all';

  @IsOptional()
  @IsString()

  from?: string;

  @IsOptional()
  @IsString()

  to?: string;

  @IsOptional()
  @IsString()

  serviceId?: string;
}