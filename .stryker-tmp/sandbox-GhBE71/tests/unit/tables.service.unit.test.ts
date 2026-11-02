// @ts-nocheck
import { Prisma } from '@prisma/client';
import * as tables from '../../src/services/tables.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

describe('tables service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('creates tables with generated QR codes and lists them in number order', async () => {
    mockPrisma.table.create.mockImplementation(async ({ data }) => ({ ...data }));
    const created = await tables.createTable({ number: 12, capacity: 4 });
    expect(created).toMatchObject({ number: 12, capacity: 4 });
    expect(created.qrCode).toEqual(expect.any(String));
    mockPrisma.table.findMany.mockResolvedValue([]);
    await tables.listTables();
    expect(mockPrisma.table.findMany).toHaveBeenCalledWith({ orderBy: { number: 'asc' } });
  });

  it('maps duplicate table numbers and missing tables to API errors', async () => {
    mockPrisma.table.create.mockRejectedValue(prismaError('P2002'));
    await expect(tables.createTable({ number: 12, capacity: 4 })).rejects.toMatchObject({ status: 409 });
    mockPrisma.table.findUnique.mockResolvedValue(null);
    await expect(tables.getTableByQrCode('missing')).rejects.toMatchObject({ status: 404 });
    mockPrisma.table.update.mockRejectedValue(prismaError('P2025'));
    await expect(tables.updateTable('id', { capacity: 2 })).rejects.toMatchObject({ status: 404 });
    mockPrisma.table.delete.mockRejectedValue(prismaError('P2025'));
    await expect(tables.deleteTable('id')).rejects.toMatchObject({ status: 404 });
  });

  it('passes updates and QR lookups through to Prisma', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: 'id' });
    await expect(tables.getTableByQrCode('qr')).resolves.toEqual({ id: 'id' });
    mockPrisma.table.update.mockResolvedValue({ id: 'id', capacity: 8 });
    await expect(tables.updateTable('id', { capacity: 8 })).resolves.toMatchObject({ capacity: 8 });
    mockPrisma.table.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.table.findUniqueOrThrow.mockResolvedValue({ id: 'id', status: 'occupied' });
    await expect(
      tables.updateTable('id', { status: 'occupied', expectedStatus: 'free' })
    ).resolves.toMatchObject({ status: 'occupied' });
    expect(mockPrisma.table.updateMany).toHaveBeenCalledWith({
      where: { id: 'id', status: 'free' },
      data: { status: 'occupied' }
    });
    mockPrisma.table.delete.mockResolvedValue({});
    await expect(tables.deleteTable('id')).resolves.toBeUndefined();
  });

  it('rejects stale table status updates and distinguishes missing tables', async () => {
    mockPrisma.table.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.table.findUnique.mockResolvedValue({ id: 'id' });
    await expect(tables.updateTable('id', { status: 'reserved', expectedStatus: 'free' }))
      .rejects.toMatchObject({ status: 409 });
    mockPrisma.table.findUnique.mockResolvedValue(null);
    await expect(tables.updateTable('missing', { status: 'reserved', expectedStatus: 'free' }))
      .rejects.toMatchObject({ status: 404 });
  });
});
