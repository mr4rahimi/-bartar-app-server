import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallFinalStatus, Prisma } from '@prisma/client';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { UpdateCallLogDto } from './dto/update-call-log.dto';
import { ListCallLogsDto } from './dto/list-call-logs.dto';

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
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new BadRequestException('Invalid date value');
  }
  return dt;
}

function toDateOnlyUTCOrThrow(dateStr: string): Date {
  return toDateOnlyUTC(dateStr);
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
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
    const serviceId = (dto as unknown as { serviceId?: number | null }).serviceId ?? null;
    const brandId = (dto as unknown as { brandId?: number | null }).brandId ?? null;
    const modelId = (dto as unknown as { modelId?: number | null }).modelId ?? null;
    const problemId = (dto as unknown as { problemId?: number | null }).problemId ?? null;
    const partId = (dto as unknown as { partId?: number | null }).partId ?? null;

    // ✅ Race-safe seq allocation: MAX(seq)+1 with retry on P2002
    const maxRetries = 12;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const agg = await this.prisma.callLog.aggregate({
          where: { date: dateOnly, operatorId },
          _max: { seq: true },
        });

        const nextSeq = (agg._max.seq ?? 0) + 1;

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
        if (e?.code === 'P2002' && attempt < maxRetries - 1) continue;
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

  async history(dto: ListCallLogsDto) {
    const take = Math.min(dto.take ?? 50, 200);
    const skip = dto.skip ?? 0;

    const where: Prisma.CallLogWhereInput = {};

    // date range on `date` (UTC DateOnly)
    if (dto.from || dto.to) {
      const gte = dto.from ? toDateOnlyUTCOrThrow(dto.from) : undefined;
      const toDate = dto.to ? toDateOnlyUTCOrThrow(dto.to) : undefined;

      // inclusive `to` => lt(to+1day)
      where.date = {
        ...(gte ? { gte } : {}),
        ...(toDate ? { lt: addDaysUTC(toDate, 1) } : {}),
      };
    }

    if (typeof dto.serviceId === 'number') {
      where.serviceId = dto.serviceId;
    }

    const q = (dto.q || '').trim();
    if (q) {
      where.OR = [
        { callerPhone: { contains: q } },
        { subjectText: { contains: q } },
        { resultText: { contains: q } },
        { operator: { is: { phone: { contains: q } } } },
        { operator: { is: { name: { contains: q } } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.callLog.count({ where }),
      this.prisma.callLog.findMany({
        where,
        orderBy: [{ date: 'desc' }, { operatorId: 'asc' }, { seq: 'asc' }],
        skip,
        take,
        include: {
          operator: { select: { id: true, name: true, phone: true, role: true } },
        },
      }),
    ]);

    return { total, items, skip, take };
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
    const anyDto = dto as unknown as {
      serviceId?: number | null;
      brandId?: number | null;
      modelId?: number | null;
      problemId?: number | null;
      partId?: number | null;
    };
    if (typeof anyDto.serviceId !== 'undefined') (data as any).serviceId = anyDto.serviceId;
    if (typeof anyDto.brandId !== 'undefined') (data as any).brandId = anyDto.brandId;
    if (typeof anyDto.modelId !== 'undefined') (data as any).modelId = anyDto.modelId;
    if (typeof anyDto.problemId !== 'undefined') (data as any).problemId = anyDto.problemId;
    if (typeof anyDto.partId !== 'undefined') (data as any).partId = anyDto.partId;

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

    async dailyReport(input: {
    from?: string;
    to?: string;
    range?: '7d' | '30d' | '3m' | '1y' | 'all';
    serviceId?: number;
  }) {
    // NOTE: date در DB به صورت DateOnly UTC ذخیره می‌شود (00:00:00Z)
    // ما برای خروجی هم همان YYYY-MM-DD را برمی‌گردانیم.

    const range = input.range ?? '7d';

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    function ymdUTC(d: Date) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    function parseYmdToUTC(s: string): Date {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (!m) throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const dt = new Date(Date.UTC(y, mo - 1, d));
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
        throw new BadRequestException('Invalid date value');
      }
      return dt;
    }

    function addDaysUTC(d: Date, days: number) {
      return new Date(d.getTime() + days * 86400000);
    }

    function startByPreset(): Date {
      if (range === '7d') return addDaysUTC(todayUTC, -6);
      if (range === '30d') return addDaysUTC(todayUTC, -29);

      // 3m و 1y: تقریبی و کافی برای گزارش (اگر دقیق ماه‌محور خواستی بعداً درستش می‌کنیم)
      if (range === '3m') return addDaysUTC(todayUTC, -90);
      if (range === '1y') return addDaysUTC(todayUTC, -365);
      return new Date(Date.UTC(1970, 0, 1));
    }

    const fromDate = input.from ? parseYmdToUTC(input.from) : startByPreset();
    const toDateInclusive = input.to ? parseYmdToUTC(input.to) : todayUTC;
    const toExclusive = addDaysUTC(toDateInclusive, 1);

    const where: Prisma.CallLogWhereInput = {
      date: { gte: fromDate, lt: toExclusive },
    };

    if (typeof input.serviceId === 'number') {
      where.serviceId = input.serviceId;
    }

    // MySQL groupBy روی DateTime (date) خوب جواب می‌دهد چون date شما همیشه 00:00Z است.
    const grouped = await this.prisma.callLog.groupBy({
      by: ['date'],
      where,
      _count: { _all: true },
      orderBy: { date: 'asc' },
    });

    // map برای اینکه روزهایی که رکورد ندارند هم 0 شوند
    const map = new Map<string, number>();
    for (const g of grouped) {
      const key = ymdUTC(g.date as unknown as Date);
      map.set(key, g._count._all);
    }

    // build full series (continuous days)
    const items: Array<{ date: string; count: number }> = [];
    for (let d = fromDate; d.getTime() < toExclusive.getTime(); d = addDaysUTC(d, 1)) {
      const key = ymdUTC(d);
      items.push({ date: key, count: map.get(key) ?? 0 });
    }

    const total = items.reduce((s, x) => s + x.count, 0);

    return {
      from: ymdUTC(fromDate),
      to: ymdUTC(toDateInclusive),
      total,
      items,
    };
  }
}