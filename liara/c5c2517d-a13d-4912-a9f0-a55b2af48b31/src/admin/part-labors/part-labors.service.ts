import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminPartLaborsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PartLaborCreateInput & { serviceId: number; partId: number; brandId?: number; modelId?: number; laborFee: number }) {
    const svc = await this.prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!svc) throw new BadRequestException('Invalid serviceId');

    const part = await this.prisma.part.findUnique({ where: { id: data.partId } });
    if (!part) throw new BadRequestException('Invalid partId');
    if (part.serviceId !== data.serviceId) {
      throw new BadRequestException('Part does not belong to selected service');
    }

    if (data.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: data.brandId } });
      if (!brand) throw new BadRequestException('Invalid brandId');
    }

    if (data.modelId) {
      const model = await this.prisma.deviceModel.findUnique({ where: { id: data.modelId } });
      if (!model) throw new BadRequestException('Invalid modelId');
      if (data.brandId && model.brandId !== data.brandId) {
        throw new BadRequestException('Model does not belong to selected brand');
      }
      if (model.serviceId && model.serviceId !== data.serviceId) {
        throw new BadRequestException('Model is not for selected service');
      }
    }

    return this.prisma.partLabor.create({
      data: {
        service: { connect: { id: data.serviceId } },
        part: { connect: { id: data.partId } },
        brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
        model: data.modelId ? { connect: { id: data.modelId } } : undefined,
        laborFee: data.laborFee,
      },
      include: { service: true, brand: true, model: true, part: true },
    });
  }

  async list(filter?: {
    serviceId?: number;
    brandId?: number;
    modelId?: number;
    partId?: number;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (filter?.serviceId) where.serviceId = filter.serviceId;
    if (filter?.brandId) where.brandId = filter.brandId;
    if (filter?.modelId) where.modelId = filter.modelId;
    if (filter?.partId) where.partId = filter.partId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.partLabor.findMany({
        where,
        include: { service: true, brand: true, model: true, part: true },
        orderBy: [
          { serviceId: 'asc' },
          { partId: 'asc' },
          { brandId: 'asc' },
          { modelId: 'asc' },
        ],
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 50,
      }),
      this.prisma.partLabor.count({ where }),
    ]);

    return { items, total };
  }

  get(id: number) {
    return this.prisma.partLabor.findUnique({
      where: { id },
      include: { service: true, brand: true, model: true, part: true },
    });
  }

  async update(id: number, data: Prisma.PartLaborUpdateInput & { laborFee?: number }) {
    const existing = await this.prisma.partLabor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('PartLabor not found');

    return this.prisma.partLabor.update({
      where: { id },
      data: {
        laborFee: (data as any).laborFee ?? undefined,
        // برای ساده‌سازی، فعلاً service/part/brand/model را جا‌به‌جا نمی‌کنیم
      },
      include: { service: true, brand: true, model: true, part: true },
    });
  }

  delete(id: number) {
    return this.prisma.partLabor.delete({ where: { id } });
  }
}
