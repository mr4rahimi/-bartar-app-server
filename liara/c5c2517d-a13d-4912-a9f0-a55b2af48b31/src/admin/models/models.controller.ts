import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/models')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminModelsController {
  constructor(private svc: AdminModelsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreateModelDto) {
    return this.svc.create(body as any);
  }

  @Post('bulk')
  @Roles('admin')
  bulk(@Body() items: CreateModelDto[]) {
    return this.svc.bulkCreate(items as any);
  }

  @Get()
  @Roles('admin')
  list(@Query('brandId') brandId?: string, @Query('serviceId') serviceId?: string) {
    return this.svc.list({
      brandId: brandId ? +brandId : undefined,
      serviceId: serviceId ? +serviceId : undefined,
    });
  }

  @Get(':id')
  @Roles('admin')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateModelDto>) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
