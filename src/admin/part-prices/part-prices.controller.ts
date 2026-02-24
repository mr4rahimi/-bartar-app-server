import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminPartPricesService } from './part-prices.service';
import { CreatePartPriceDto } from './dto/create-part-price.dto';
import { PartPriceBulkUpdateDto } from './dto/bulk-update-part-price.dto';

@Controller('admin/part-prices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminPartPricesController {
  constructor(private svc: AdminPartPricesService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: CreatePartPriceDto) {
    return this.svc.create(body as any);
  }

  @Get()
  @Roles('admin')
  list(
    @Query('serviceId') serviceId?: string,
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
    @Query('partId') partId?: string,
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.list({
      serviceId: serviceId ? +serviceId : undefined,
      brandId: brandId ? +brandId : undefined,
      modelId: modelId ? +modelId : undefined,
      partId: partId ? +partId : undefined,
      q: q || undefined,
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
    });
  }

  @Get(':id')
  @Roles('admin')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.get(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreatePartPriceDto>) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.svc.delete(id);
  }

  @Post('bulk-update')
  @Roles('admin')
  bulkUpdate(@Body() body: PartPriceBulkUpdateDto) {
    return this.svc.bulkUpdate(body);
  }
}
