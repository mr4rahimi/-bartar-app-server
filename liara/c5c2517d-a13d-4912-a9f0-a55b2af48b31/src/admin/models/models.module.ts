import { Module } from '@nestjs/common';
import { AdminModelsService } from './models.service';
import { AdminModelsController } from './models.controller';

@Module({
  providers: [AdminModelsService],
  controllers: [AdminModelsController],
})
export class AdminModelsModule {}
