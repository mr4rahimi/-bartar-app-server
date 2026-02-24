import { IsBoolean } from 'class-validator';

export class FinalizeCallLogDto {
  @IsBoolean()
  finalized: boolean;
}