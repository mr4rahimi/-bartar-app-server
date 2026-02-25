import { IsInt, IsOptional, IsString } from 'class-validator';

export class WalletAdjustDto {
  @IsInt()
  amount: number; 

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
