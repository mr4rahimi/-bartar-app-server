import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminServicesService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ServiceCreateInput) {
    return this.prisma.service.create({ data });
  }

  list() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  get(id: number) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.service.delete({ where: { id } });
  }
}
