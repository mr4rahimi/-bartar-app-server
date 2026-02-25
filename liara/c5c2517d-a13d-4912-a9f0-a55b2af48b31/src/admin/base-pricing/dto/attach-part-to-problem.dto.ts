import { IsInt } from 'class-validator';

export class AttachPartToProblemDto {
  @IsInt()
  problemId: number;

  @IsInt()
  partId: number;
}
