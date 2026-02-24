import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, CallFinalStatus } from '@prisma/client';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { UpdateCallLogDto } from './dto/update-call-log.dto';

function toDateOnly(dateStr?: string): Date {
  // انتظار: YYYY-MM-DD
  if (!dateStr) {
    const now = new Date();
    // ساخت DateOnly با timezone محلی سرور
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  const dt = new Date(y, mo - 1, d);

  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    throw new BadRequestException('Invalid date value');
  }
  return dt;
}

@Injectable()
export class AdminCallLogsService {
  constructor(private prisma: PrismaService) {}

  async create(operatorId: number, dto: CreateCallLogDto) {
    if (!operatorId) throw new BadRequestException('Missing operatorId (auth)');

    const dateOnly = toDateOnly(dto.date);

    const subjectText = (dto.subjectText || '').trim();
    const callerPhone = (dto.callerPhone || '').trim();
    const resultText = dto.resultText != null ? String(dto.resultText).trim() : undefined;

    if (!subjectText) throw new BadRequestException('subjectText is required');
    if (!callerPhone) throw new BadRequestException('callerPhone is required');

    const dataForInsert: Prisma.CallLogCreateInput = {
      date: dateOnly,
      seq: 0 as any, 
      callTime: new Date(),
      subjectText,
      callerPhone,
      resultText: resultText || undefined,
      finalStatus: CallFinalStatus.PENDING,
      finalizedAt: null,
      operator: { connect: { id: operatorId } },
    };


    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const last = await tx.callLog.findFirst({
            where: { date: dateOnly, operatorId },
            orderBy: { seq: 'desc' },
            select: { seq: true },
          });

          const nextSeq = (last?.seq ?? 0) + 1;

          const created = await tx.callLog.create({
            data: {
              ...dataForInsert,
              seq: nextSeq,
            } as any,
          });

          return created;
        });
      } catch (e: any) {
        // Prisma unique constraint => P2002
        const code = e?.code || e?.meta?.cause;
        if (e?.code === 'P2002' && attempt < maxRetries) continue;
        throw e;
      }
    }
  }

  async list(input?: { date?: string }) {
    const dateOnly = toDateOnly(input?.date);

  
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
    if (typeof dto.resultText !== 'undefined') data.resultText = dto.resultText == null ? null : String(dto.resultText).trim();


    if (typeof dto.serviceId !== 'undefined') data.serviceId = dto.serviceId as any;
    if (typeof dto.brandId !== 'undefined') data.brandId = dto.brandId as any;
    if (typeof dto.modelId !== 'undefined') data.modelId = dto.modelId as any;
    if (typeof dto.problemId !== 'undefined') data.problemId = dto.problemId as any;
    if (typeof dto.partId !== 'undefined') data.partId = dto.partId as any;

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

    if (finalized) {
      return this.prisma.callLog.update({
        where: { id },
        data: {
          finalStatus: CallFinalStatus.FINAL,
          finalizedAt: new Date(),
        },
        include: {
          operator: { select: { id: true, name: true, phone: true, role: true } },
        },
      });
    }

    return this.prisma.callLog.update({
      where: { id },
      data: {
        finalStatus: CallFinalStatus.PENDING,
        finalizedAt: null,
      },
      include: {
        operator: { select: { id: true, name: true, phone: true, role: true } },
      },
    });
  }
}
