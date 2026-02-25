// src/admin/technicians/technicians.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

function randomDigits(n: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}
function generatePhoneCandidate() {
  return '09' + randomDigits(9); // IR pattern: 09xxxxxxxxx
}

@Injectable()
export class AdminTechniciansService {
  constructor(private prisma: PrismaService) {}

  // generate a unique phone (with DB check)
  private async generateUniquePhone(maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = generatePhoneCandidate();
      const existing = await this.prisma.user.findUnique({ where: { phone: candidate } });
      if (!existing) return candidate;
    }
    throw new ConflictException('Could not generate a unique phone number');
  }

  // list technicians (users with role = 'technician')
  async list() {
    return this.prisma.user.findMany({
      where: { role: 'technician' },
      include: {
        TechnicianProfile: true,
        assignedOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { TechnicianProfile: true, assignedOrders: true },
    });
    if (!user) throw new NotFoundException('Technician not found');
    return user;
  }

  /**
   * create technician:
   * - if phone not provided, generate a unique one
   * - hash password (or generate temporary)
   * - create user with role 'technician' and optional TechnicianProfile
   * - retry on phone collision (P2002) a few times
   */
  async create(data: {
    phone?: string;
    name?: string;
    email?: string;
    password?: string;
    bio?: string;
    experience?: number;
  }) {
    // phone must be present (either provided or generated)
    let phoneToUse = data.phone?.trim() || undefined;
    if (!phoneToUse) {
      phoneToUse = await this.generateUniquePhone();
    }

    const rawPwd = data.password ?? Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(rawPwd, 10);

    const maxCreateAttempts = 5;
    for (let attempt = 0; attempt < maxCreateAttempts; attempt++) {
      try {
        const user = await this.prisma.user.create({
          data: {
            phone: phoneToUse,
            name: data.name,
            email: data.email ?? undefined,
            password: hashed,
            role: 'technician',
            TechnicianProfile:
              data.bio || data.experience !== undefined
                ? {
                    create: {
                      bio: data.bio,
                      experience: data.experience,
                    },
                  }
                : undefined,
          },
          include: { TechnicianProfile: true, assignedOrders: true },
        });

        return { user, rawPassword: rawPwd };
      } catch (err: any) {
        // handle unique constraint collisions (P2002)
        if (err?.code === 'P2002') {
          const target = err?.meta?.target;
          // if phone collision -> try again with new phone
          if (Array.isArray(target) && target.includes('phone')) {
            if (attempt === maxCreateAttempts - 1) {
              throw new ConflictException('Could not create technician due to repeated phone collisions');
            }
            phoneToUse = await this.generateUniquePhone();
            continue;
          }
          // other unique violation (email...) -> return conflict
          throw new ConflictException(`Unique constraint failed: ${JSON.stringify(target)}`);
        }
        throw err;
      }
    }

    throw new ConflictException('Failed to create technician');
  }

  // update basic user info + profile
  async update(id: number, data: { name?: string; email?: string; password?: string; bio?: string; experience?: number }) {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.password !== undefined) updates.password = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data: updates,
      include: { TechnicianProfile: true, assignedOrders: true },
    });

    // update or create TechnicianProfile
    if (data.bio !== undefined || data.experience !== undefined) {
      const existingProfile = await this.prisma.technicianProfile.findUnique({ where: { userId: id } });
      if (existingProfile) {
        await this.prisma.technicianProfile.update({
          where: { userId: id },
          data: { bio: data.bio ?? existingProfile.bio, experience: data.experience ?? existingProfile.experience },
        });
      } else {
        await this.prisma.technicianProfile.create({
          data: { userId: id, bio: data.bio ?? undefined, experience: data.experience ?? undefined },
        });
      }
    }

    return this.get(id);
  }

  // "soft" remove: demote to user (safer) — can be changed to delete if you prefer
  async remove(id: number) {
    // If you prefer full deletion: return prisma.user.delete({ where: { id } })
    await this.prisma.user.update({ where: { id }, data: { role: 'user' } });
    return { ok: true };
  }

  // history of technician (orders assigned)
  async history(id: number) {
    return this.prisma.order.findMany({
      where: { technicianId: id },
      include: { reports: true, user: true, service: true, brandRel: true, modelRel: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
