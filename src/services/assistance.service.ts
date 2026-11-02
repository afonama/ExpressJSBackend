import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../errors.js';
import type { createAssistanceSchema } from '../schemas/assistance.schemas.js';
import type { z } from 'zod';

type CreateAssistanceInput = z.infer<typeof createAssistanceSchema>;

export async function createAssistanceRequest(input: CreateAssistanceInput) {
  const table = await prisma.table.findUnique({ where: { id: input.tableId } });
  if (!table) throw notFound('Table not found');
  return prisma.assistanceRequest.create({
    data: { tableId: input.tableId, type: input.type, status: 'pending' }
  });
}

export async function listAssistanceRequests(pendingOnly: boolean | undefined) {
  return prisma.assistanceRequest.findMany({
    where: pendingOnly !== false ? { status: 'pending' } : {},
    include: { table: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function resolveAssistanceRequest(id: string) {
  try {
    return await prisma.assistanceRequest.update({
      where: { id },
      data: { status: 'resolved', resolvedAt: new Date() },
      include: { table: true }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Assistance request not found');
    }
    throw err;
  }
}
