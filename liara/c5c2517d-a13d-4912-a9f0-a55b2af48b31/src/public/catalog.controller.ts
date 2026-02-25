import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { OrderStage, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminPartPricesService } from '../admin/part-prices/part-prices.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private prisma: PrismaService,
    private partPricesService: AdminPartPricesService, 
  ) {}

  @Get('services')
  async services() {
    return this.prisma.service.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  @Get('services/:id/brands')
  async brandsByService(@Param('id', ParseIntPipe) id: number) {
    const links = await this.prisma.brandService.findMany({
      where: { serviceId: id },
      include: { brand: true },
    });
    return links.map((l) => l.brand);
  }

  @Get('brands')
  async brands(@Query('serviceId') serviceId?: string) {
    if (!serviceId) {
      return this.prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    }
    const sid = +serviceId;
    const links = await this.prisma.brandService.findMany({
      where: { serviceId: sid },
      include: { brand: true },
    });
    return links.map((l) => l.brand);
  }

  @Get('brands/:id/models')
  async modelsByBrand(@Param('id', ParseIntPipe) id: number, @Query('serviceId') serviceId?: string) {
    const where: Record<string, any> = { brandId: id, active: true };
    if (serviceId) where.serviceId = +serviceId;
    return this.prisma.deviceModel.findMany({ where, orderBy: { name: 'asc' } });
  }

  @Get('services/:id/problems')
  async problemsByService(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.problem.findMany({ where: { serviceId: id, active: true }, orderBy: { name: 'asc' } });
  }

  @Get('banners')
  async banners() {
    return this.prisma.banner.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  }

  @Get('orders/meta')
  orderMeta() {
    return {
      statuses: Object.values(OrderStatus),
      stages: Object.values(OrderStage),
    };
  }

   @Get('parts/prices')
  async publicPartPrices(
    @Query('serviceId') serviceId?: string,
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
    @Query('partId') partId?: string,
  ) {
    return this.partPricesService.publicList({
      serviceId: serviceId ? +serviceId : undefined,
      brandId: brandId ? +brandId : undefined,
      modelId: modelId ? +modelId : undefined,
      partId: partId ? +partId : undefined,
    });
  }
}

