import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateOrderDto } from "./create-order.dto";

export class PublicCreateOrderDto extends CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  problemId?: number;
}
