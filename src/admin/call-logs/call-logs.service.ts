import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallFinalStatus, Prisma } from '@prisma/client';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { UpdateCallLogDto } from './dto/update-call-log.dto';

function toDateOnlyUTC(dateStr?: string): Date {
  // YYYY-MM-DD -> Date at 00:00:00 UTC (timezone-safe)
  if (!dateStr) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  const dt = new Date(Date.UTC(y, mo - 1, d));
  // validate
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new BadRequestException('Invalid date value');
  }
  return dt;
}

@Injectable()
export class AdminCallLogsService {
  constructor(private prisma: PrismaService) {}

  async create(operatorId: number, dto: CreateCallLogDto) {
    if (!operatorId) throw new BadRequestException('Missing operatorId (auth)');

    const dateOnly = toDateOnlyUTC(dto.date);

    const subjectText = (dto.subjectText || '').trim();
    const callerPhone = (dto.callerPhone || '').trim();
    const resultText = dto.resultText != null ? String(dto.resultText).trim() : null;

    if (!subjectText) throw new BadRequestException('subjectText is required');
    if (!callerPhone) throw new BadRequestException('callerPhone is required');

    // اگر در DTO داری، این‌ها را هم ست می‌کنیم (اختیاری)
    const serviceId = (dto as any).serviceId ?? null;
    const brandId = (dto as any).brandId ?? null;
    const modelId = (dto as any).modelId ?? null;
    const problemId = (dto as any).problemId ?? null;
    const partId = (dto as any).partId ?? null;

    // ✅ Race-safe seq allocation: MAX(seq)+1 with retry on P2002
    const maxRetries = 12;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const agg = await this.prisma.callLog.aggregate({
          where: { date: dateOnly, operatorId },
          _max: { seq: true },
        });

        const nextSeq = (agg._max.seq ?? 0) + 1;

        // ✅ UncheckedCreateInput اجازه می‌دهد operatorId را مستقیم ست کنیم
        const data: Prisma.CallLogUncheckedCreateInput = {
          date: dateOnly,
          operatorId,
          seq: nextSeq,
          callTime: new Date(),
          subjectText,
          callerPhone,
          resultText: resultText || null,
          finalStatus: CallFinalStatus.PENDING,
          finalizedAt: null,

          serviceId,
          brandId,
          modelId,
          problemId,
          partId,
        };

        return await this.prisma.callLog.create({
          data,
          include: {
            operator: { select: { id: true, name: true, phone: true, role: true } },
          },
        });
      } catch (e: any) {
        // Prisma unique constraint
        if (e?.code === 'P2002' && attempt < maxRetries - 1) {
          continue;
        }
        throw e;
      }
    }

    throw new BadRequestException('Could not allocate seq. Please retry.');
  }

  async list(input?: { date?: string }) {
    const dateOnly = toDateOnlyUTC(input?.date);

    return this.prisma.callLog.findMany({
      where: { date: dateOnly },
      orderBy: [{ operatorId: 'asc' }, { seq: 'asc' }],
      include: {
        operator: { select: { id: true, name: true, phone: true, role: true } },
      },
    });
  }

  async update(id: number, dto: UpdateCallLogDto) {
    const existing = await this.prisma.callLog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('CallLog not found');

    const data: Prisma.CallLogUpdateInput = {};

    if (typeof dto.subjectText !== 'undefined') data.subjectText = String(dto.subjectText).trim();
    if (typeof dto.callerPhone !== 'undefined') data.callerPhone = String(dto.callerPhone).trim();
    if (typeof dto.resultText !== 'undefined') {
      data.resultText = dto.resultText == null ? null : String(dto.resultText).trim();
    }

    // optional ids
    if (typeof (dto as any).serviceId !== 'undefined') (data as any).serviceId = (dto as any).serviceId;
    if (typeof (dto as any).brandId !== 'undefined') (data as any).brandId = (dto as any).brandId;
    if (typeof (dto as any).modelId !== 'undefined') (data as any).modelId = (dto as any).modelId;
    if (typeof (dto as any).problemId !== 'undefined') (data as any).problemId = (dto as any).problemId;
    if (typeof (dto as any).partId !== 'undefined') (data as any).partId = (dto as any).partId;

    if ('subjectText' in data && !(data.subjectText as string)) {
      throw new BadRequestException('subjectText cannot be empty');
    }
    if ('callerPhone' in data && !(data.callerPhone as string)) {
      throw new BadRequestException('callerPhone cannot be empty');
    }

    return this.prisma.callLog.update({
      where: { id },
      data,
      include: {
        operator: { select: { id: true, name: true, phone: true, role: true } },
      },
    });
  }

  async setFinalized(id: number, finalized: boolean) {
    const existing = await this.prisma.callLog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('CallLog not found');

    return this.prisma.callLog.update({
      where: { id },
      data: finalized
        ? { finalStatus: CallFinalStatus.FINAL, finalizedAt: new Date() }
        : { finalStatus: CallFinalStatus.PENDING, finalizedAt: null },
      include: {
        operator: { select: { id: true, name: true, phone: true, role: true } },
      },
    });
  }
}