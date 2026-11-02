import { randomUUID } from 'crypto';
import { Prisma, type TableStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, notFound } from '../errors.js';

export async function createTable(data: { number: number; capacity: number }) {
  try {
    return await prisma.table.create({
      data: { number: data.number, capacity: data.capacity, qrCode: randomUUID() }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw conflict('Table number already exists');
    }
    throw err;
  }
}

export async function listTables() {
  return prisma.table.findMany({ orderBy: { number: 'asc' } });
}

export async function getTableByQrCode(qrCode: string) {
  const table = await prisma.table.findUnique({ where: { qrCode } });
  if (!table) throw notFound('Table not found');
  return table;
}

export async function updateTable(
  id: string,
  data: { capacity?: number; status?: TableStatus; expectedStatus?: TableStatus }
) {
  if (data.status !== undefined) {
    const { expectedStatus, ...updates } = data;
    const result = await prisma.table.updateMany({
      where: { id, status: expectedStatus },
      data: updates
    });
    if (result.count === 0) {
      const table = await prisma.table.findUnique({ where: { id }, select: { id: true } });
      if (!table) throw notFound('Table not found');
      throw conflict('Table status changed; reload the table before retrying');
    }
    return prisma.table.findUniqueOrThrow({ where: { id } });
  }

  const { expectedStatus: _expectedStatus, ...updates } = data;
  try {
    return await prisma.table.update({ where: { id }, data: updates });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Table not found');
    }
    throw err;
  }
}

export async function deleteTable(id: string): Promise<void> {
  try {
    await prisma.table.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Table not found');
    }
    throw err;
  }
}