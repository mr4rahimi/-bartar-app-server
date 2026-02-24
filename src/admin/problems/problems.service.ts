// D:\projects\bartar-app\backend\src\admin\problems\problems.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminProblemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * ساخت مشکل جدید
   * (اگر در آینده خواستی از همین مسیر هم partId بفرستی، این تابع آماده‌ست)
   */
  async create(
    data: Prisma.ProblemUncheckedCreateInput & { partId?: number | null },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { partId, ...rest } = data;

      // ✅ ساخت خود Problem (مثل قبل، با serviceId مستقیم)
      const problem = await tx.problem.create({
        data: rest,
      });

      // ✅ اگر partId داده شده بود، نگاشت ProblemPart بساز
      if (partId) {
        const part = await tx.part.findUnique({ where: { id: partId } });
        if (!part) throw new BadRequestException('Invalid partId');
        if (part.serviceId !== problem.serviceId) {
          throw new BadRequestException(
            'Part does not belong to the same service',
          );
        }

        await tx.problemPart.create({
          data: {
            problemId: problem.id,
            partId,
          },
        });
      }

      const full = await tx.problem.findUnique({
        where: { id: problem.id },
        include: {
          service: true,
          problemParts: { include: { part: true } },
        },
      });

      return this.mapProblemWithSinglePart(full);
    });
  }

  /**
   * لیست همه مشکلات (مثل قبل، فقط الان service و نگاشت قطعه هم همراهشه)
   * قبلاً: orderBy createdAt desc
   */
  async list() {
    const items = await this.prisma.problem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        problemParts: { include: { part: true } },
      },
    });

    return items.map((p) => this.mapProblemWithSinglePart(p));
  }

  /**
   * لیست مشکلات برای یک سرویس خاص
   * قبلاً: فیلتر روی serviceId و orderBy name asc
   */
  async listByService(serviceId: number) {
    const items = await this.prisma.problem.findMany({
      where: { serviceId },
      orderBy: { name: 'asc' },
      include: {
        service: true,
        problemParts: { include: { part: true } },
      },
    });

    return items.map((p) => this.mapProblemWithSinglePart(p));
  }

  /**
   * دریافت یک مشکل
   * قبلاً: findUnique ساده؛ الان با include اضافه
   */
  async get(id: number) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        service: true,
        problemParts: { include: { part: true } },
      },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    return this.mapProblemWithSinglePart(problem);
  }

  /**
   * آپدیت مشکل + مدیریت نگاشت قطعه
   *
   * - بقیه فیلدها (name, code, active, serviceId, ...) دقیقاً مثل قبل آپدیت می‌شن
   * - اگر body.partId وجود داشته باشه:
   *    - number → upsert روی ProblemPart
   *    - null   → حذف نگاشت (مشکل بدون قطعه → قیمت پایه ۰)
   */
  async update(
    id: number,
    data: Prisma.ProblemUncheckedUpdateInput & { partId?: number | null },
  ) {
    const { partId, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      // ✅ اول خود Problem را مثل قبل آپدیت می‌کنیم (بدون دست‌زدن به partId)
      if (Object.keys(rest).length > 0) {
        await tx.problem.update({
          where: { id },
          data: rest,
        });
      }

      // ✅ حالا اگر partId در body بود، نگاشت ProblemPart را مدیریت کن
      if (typeof partId !== 'undefined') {
        if (partId === null) {
          // حذف نگاشت → مشکل بدون قطعه → قیمت پایه ۰
          await tx.problemPart.deleteMany({
            where: { problemId: id },
          });
        } else {
          // اضافه/تغییر نگاشت قطعه
          const problem = await tx.problem.findUnique({ where: { id } });
          if (!problem) throw new NotFoundException('Problem not found');

          const part = await tx.part.findUnique({ where: { id: partId } });
          if (!part) throw new BadRequestException('Invalid partId');

          if (part.serviceId !== problem.serviceId) {
            throw new BadRequestException(
              'Part does not belong to the same service',
            );
          }

          // چون تو schema: @@unique([problemId]) داریم,
          // می‌تونیم upsert روی problemId بزنیم (یک قطعه برای هر مشکل)
          await tx.problemPart.upsert({
            where: { problemId: id },
            update: { partId },
            create: { problemId: id, partId },
          });
        }
      }

      const full = await tx.problem.findUnique({
        where: { id },
        include: {
          service: true,
          problemParts: { include: { part: true } },
        },
      });

      return this.mapProblemWithSinglePart(full);
    });
  }

  /**
   * حذف مشکل
   * قبلاً: مستقیم delete؛
   * الان: اول نگاشت‌ها رو پاک می‌کنیم بعد خود مشکل رو.
   */
  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.problemPart.deleteMany({ where: { problemId: id } });
      await tx.problem.delete({ where: { id } });
      return { success: true };
    });
  }

  /**
   * Helper:
   * خروجی problem را طوری تبدیل می‌کند که:
   * - problem.partId → از اولین ProblemPart
   * - problem.part   → همان Part
   *
   * این دقیقاً چیزی است که در صفحه ProblemPartMapping ازش استفاده می‌کنی.
   */
  private mapProblemWithSinglePart(problem: any): any {
    if (!problem) return problem;

    const first =
      problem.problemParts && problem.problemParts.length
        ? problem.problemParts[0]
        : null;

    return {
      ...problem,
      partId: first?.partId ?? null,
      part: first?.part ?? null,
    };
  }
}
