import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCallLogDto {
  @IsOptional()
  @IsString()
  subjectText?: string;

  @IsOptional()
  @IsString()
  @Length(3, 32)
  callerPhone?: string;

  @IsOptional()
  @IsString()
  resultText?: string;

  @IsOptional()
  @IsInt()
  serviceId?: number | null;

  @IsOptional()
  @IsInt()
  brandId?: number | null;

  @IsOptional()
  @IsInt()
  modelId?: number | null;

  @IsOptional()
  @IsInt()
  problemId?: number | null;

  @IsOptional()
  @IsInt()
  partId?: number | null;
}