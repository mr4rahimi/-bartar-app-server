import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminBrandsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.BrandCreateInput & { serviceIds?: number[] }) {
    const { serviceIds, ...rest } = data as any;
    const brand = await this.prisma.brand.create({ data: rest });
    if (serviceIds && serviceIds.length) {
      const createLinks = serviceIds.map((sid) => ({ brandId: brand.id, serviceId: sid }));
      await this.prisma.brandService.createMany({ data: createLinks, skipDuplicates: true });
    }
    return this.findOne(brand.id);
  }

  async findOne(id: number) {
    return this.prisma.brand.findUnique({
      where: { id },
      include: { services: { include: { service: true } }, models: true },
    });
  }

  list() {
    return this.prisma.brand.findMany({
      include: { services: { include: { service: true } }, models: true },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, data: Prisma.BrandUpdateInput & { serviceIds?: number[] }) {
    const { serviceIds, ...rest } = data as any;
    await this.prisma.brand.update({ where: { id }, data: rest });
    if (serviceIds) {
      
      await this.prisma.$transaction(async (tx) => {
        await tx.brandService.deleteMany({ where: { brandId: id, NOT: { serviceId: { in: serviceIds } } } });
        const payload = serviceIds.map((sid) => ({ brandId: id, serviceId: sid }));
        await tx.brandService.createMany({ data: payload, skipDuplicates: true });
      });
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.prisma.brand.delete({ where: { id } });
  }
}
