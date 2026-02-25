import { Body, Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { PreviewBasePriceDto } from './dto/preview-base-price.dto';


@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req: any, @Body() body: CreateOrderDto) {
    const userId = req.user.userId;
    return this.ordersService.create(userId, body);
  }

    @UseGuards(AuthGuard('jwt'))
  @Post('preview-base-price')
  async previewBasePrice(@Body() body: PreviewBasePriceDto) {
    return this.ordersService.previewBasePrice(body);
  }



  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async myOrders(@Req() req: any) {
    const userId = req.user.userId;
    return this.ordersService.listForUser(userId);
  }

 
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async all(@Req() req: any) {
    
    return this.ordersService.listAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.ordersService.findById(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/confirm-final-price')
  async confirmFinalPrice(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const orderId = Number(id);
    return this.ordersService.confirmFinalPrice(orderId, userId);
  }

}
