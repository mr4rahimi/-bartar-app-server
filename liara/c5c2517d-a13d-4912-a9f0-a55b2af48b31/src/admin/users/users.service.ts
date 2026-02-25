import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WalletAdjustDto } from './dto/wallet-adjust.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async list(skip = 0, take = 50) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }

  async get(id: number) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async create(dto: CreateUserDto) {
    // اگر password نداشتیم، یک رمز موقت ایجاد کن
    const password = dto.password ?? Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        email: dto.email,
        password: hashed,
      },
    });
    return { user, rawPassword: dto.password ? undefined : password }; // اگر رمز تصادفی ساختیم بازگردان
  }

  async update(id: number, dto: UpdateUserDto) {
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  async adjustWallet(id: number, dto: WalletAdjustDto) {
    // transaction: update balance and create transaction row
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      const newBalance = user.walletBalance + dto.amount;
      // optional: prevent negative balance? (here we allow negative)
      await prisma.user.update({ where: { id }, data: { walletBalance: newBalance } });

      const txn = await prisma.walletTransaction.create({
        data: {
          userId: id,
          amount: dto.amount,
          type: dto.type ?? 'admin_adjust',
          note: dto.note,
        },
      });

      return { newBalance, txn };
    });
  }

  async transactions(id: number, skip = 0, take = 50) {
    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({ where: { userId: id }, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.walletTransaction.count({ where: { userId: id } }),
    ]);
    return { items, total };
  }
}
