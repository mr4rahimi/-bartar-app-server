import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UsersModule } from '../users/users.module';
import { PublicOrdersController } from './public-orders.controller';
import { NotificationsModule } from '../notifications/notifications.module';


@Module({
  imports: [UsersModule, NotificationsModule],
  providers: [OrdersService],
  controllers: [OrdersController, PublicOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}

