import { Module } from '@nestjs/common';
import { AdminOrdersService } from './orders.service';
import { AdminOrdersController } from './orders.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  controllers: [AdminOrdersController],
  imports: [NotificationsModule],
  providers: [AdminOrdersService, PrismaService],
})
export class AdminOrdersModule {}