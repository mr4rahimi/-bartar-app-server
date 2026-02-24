import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateCallLogDto {

  @IsOptional()
  @IsString()
  @Length(10, 10)
  date?: string;

  @IsString()
  subjectText: string;

  @IsString()
  @Length(3, 32)
  callerPhone: string;

  @IsOptional()
  @IsString()
  resultText?: string;

  // refs (اختیاری)
  @IsOptional()
  @IsInt()
  serviceId?: number;

  @IsOptional()
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsInt()
  modelId?: number;

  @IsOptional()
  @IsInt()
  problemId?: number;

  @IsOptional()
  @IsInt()
  partId?: number;
}