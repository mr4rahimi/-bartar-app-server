import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminModelsService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.DeviceModelCreateInput) {
    return this.prisma.deviceModel.create({ data });
  }

  bulkCreate(items: { name: string; code?: string; brandId: number; serviceId?: number }[]) {
    const payload = items.map((i) => ({
      name: i.name,
      code: i.code,
      brandId: i.brandId,
      serviceId: i.serviceId ?? null,
    }));
    return this.prisma.deviceModel.createMany({ data: payload, skipDuplicates: true });
  }

  list(filter?: { brandId?: number; serviceId?: number }) {
    const where: any = {};
    if (filter?.brandId) where.brandId = filter.brandId;
    if (filter?.serviceId) where.serviceId = filter.serviceId;
    return this.prisma.deviceModel.findMany({ where, orderBy: { name: 'asc' } });
  }

  get(id: number) {
    return this.prisma.deviceModel.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.DeviceModelUpdateInput) {
    return this.prisma.deviceModel.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.deviceModel.delete({ where: { id } });
  }
}
