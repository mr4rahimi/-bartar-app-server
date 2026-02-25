import { Module } from '@nestjs/common';
import { AdminPartsService } from './parts.service';
import { AdminPartsController } from './parts.controller';

@Module({
  providers: [AdminPartsService],
  controllers: [AdminPartsController],
  exports: [AdminPartsService],
})
export class AdminPartsModule {}
