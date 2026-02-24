import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminPartsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PartCreateInput & { serviceId: number }) {
    const svc = await this.prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!svc) throw new BadRequestException('Invalid serviceId');

    return this.prisma.part.create({
      data: {
        name: data.name,
        code: (data as any).code ?? null,
        service: { connect: { id: data.serviceId } },
        active: (data as any).active ?? true,
      },
    });
  }

  async list(filter?: { serviceId?: number; q?: string }) {
    const where: any = {};
    if (filter?.serviceId) where.serviceId = filter.serviceId;
    if (filter?.q) {
      where.OR = [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { code: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.part.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { service: true },
    });
  }

  get(id: number) {
    return this.prisma.part.findUnique({ where: { id }, include: { service: true } });
  }

  async update(id: number, data: Prisma.PartUpdateInput & { serviceId?: number }) {
    const existing = await this.prisma.part.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Part not found');

    let serviceConnect: any = {};
    if (data.serviceId) {
      const svc = await this.prisma.service.findUnique({ where: { id: data.serviceId as any } });
      if (!svc) throw new BadRequestException('Invalid serviceId');
      serviceConnect = { service: { connect: { id: data.serviceId as any } } };
    }

    return this.prisma.part.update({
      where: { id },
      data: {
        name: (data as any).name ?? undefined,
        code: (data as any).code ?? undefined,
        active: (data as any).active ?? undefined,
        ...serviceConnect,
      },
    });
  }

  remove(id: number) {
    return this.prisma.part.delete({ where: { id } });
  }
}
