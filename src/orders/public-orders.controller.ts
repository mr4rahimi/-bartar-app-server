import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UsersService } from '../users/users.service';
import { PublicCreateOrderDto } from './dto/public-create-order.dto';
import * as bcrypt from 'bcryptjs';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService, private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body: PublicCreateOrderDto) {
    const { phone, name } = body;
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      const password = await bcrypt.hash(`TEMP-${Date.now()}-${Math.random()}`, 10);
      user = await this.usersService.create({ phone, name, password });
    } else if (name && !user.name) {
      await this.usersService.update(user.id, { name });
    }

    return this.ordersService.create(user.id, body);
  }
}
