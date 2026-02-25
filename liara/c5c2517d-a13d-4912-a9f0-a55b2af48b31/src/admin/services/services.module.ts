import { Module } from '@nestjs/common';
import { AdminServicesService } from './services.service';
import { AdminServicesController } from './services.controller';

@Module({
  providers: [AdminServicesService],
  controllers: [AdminServicesController],
})
export class AdminServicesModule {}
