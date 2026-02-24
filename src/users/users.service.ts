// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    name?: string;
    phone: string;
    email?: string;
    password: string;
    role?: Prisma.UserCreateInput['role'];
  }): Promise<User> {
    const payload: Prisma.UserCreateInput = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      password: data.password,
      role: (data.role as any) ?? 'user',
    } as Prisma.UserCreateInput;

    return this.prisma.user.create({ data: payload });
  }

  async update(id: number, data: Partial<Prisma.UserUpdateInput>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  async listAll(skip = 0, take = 100) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }
}
