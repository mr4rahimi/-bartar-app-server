import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminBasePricingService {
  constructor(private prisma: PrismaService) {}

  async attachPartToProblem(problemId: number, partId: number) {
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new BadRequestException('Invalid problemId');

    const part = await this.prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new BadRequestException('Invalid partId');

    // فقط اجازه یک قطعه برای هر مشکل
    const existing = await this.prisma.problemPart.findUnique({ where: { problemId } });
    if (existing) {
      // یا می‌تونی اجازه‌ی آپدیت بدی، من این‌جا ارور می‌دهم
      throw new BadRequestException('This problem already has a part assigned');
    }

    return this.prisma.problemPart.create({
      data: {
        problem: { connect: { id: problemId } },
        part: { connect: { id: partId } },
      },
      include: { problem: true, part: true },
    });
  }

  async detachPartFromProblem(problemId: number) {
    const existing = await this.prisma.problemPart.findUnique({ where: { problemId } });
    if (!existing) return;
    return this.prisma.problemPart.delete({ where: { problemId } });
  }

  listMappingsByService(serviceId: number) {
    return this.prisma.problemPart.findMany({
      where: { problem: { serviceId } },
      include: { problem: true, part: true },
    });
  }

  async setMarkupPercent(percent: number) {
    // یک ردیف ثابت با id=1
    return this.prisma.pricingConfig.upsert({
      where: { id: 1 },
      update: { partMarkupPercent: percent },
      create: { id: 1, partMarkupPercent: percent },
    });
  }

  async getMarkupPercent() {
    const cfg = await this.prisma.pricingConfig.findUnique({ where: { id: 1 } });
    return cfg?.partMarkupPercent ?? 0;
  }
}
