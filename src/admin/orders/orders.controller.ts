import { Controller, Get, Param, Patch, Body, Post, Delete } from '@nestjs/common';
import { AdminOrdersService } from './orders.service';

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Get()
  list() {
    return this.ordersService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.ordersService.get(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.ordersService.update(Number(id), data);
  }

  @Post(':id/assign-technician')
  assignTechnician(@Param('id') id: string, @Body('technicianId') technicianId: number) {
    return this.ordersService.assignTechnician(Number(id), technicianId);
  }

  @Post(':id/report')
  createReport(
    @Param('id') id: string,
    @Body() body: { actorId: number; action: string; details?: string },
  ) {
    return this.ordersService.createReport(Number(id), body.actorId, body.action, body.details);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(Number(id));
  }
}