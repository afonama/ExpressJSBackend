// @ts-nocheck
import { Prisma } from '@prisma/client';
import * as assistance from '../../src/services/assistance.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

describe('assistance service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('validates the table and creates requests pending by default', async () => {
    mockPrisma.table.findUnique.mockResolvedValue(null);
    await expect(assistance.createAssistanceRequest({ tableId: 'missing', type: 'call_waiter' }))
      .rejects.toMatchObject({ status: 404 });
    mockPrisma.table.findUnique.mockResolvedValue({ id: 'table' });
    mockPrisma.assistanceRequest.create.mockResolvedValue({ id: 'request', status: 'pending' });
    await assistance.createAssistanceRequest({ tableId: 'table', type: 'request_bill' });
    expect(mockPrisma.assistanceRequest.create).toHaveBeenCalledWith({
      data: { tableId: 'table', type: 'request_bill', status: 'pending' }
    });
  });

  it('lists pending by default and includes resolved requests when requested', async () => {
    mockPrisma.assistanceRequest.findMany.mockResolvedValue([]);
    await assistance.listAssistanceRequests(undefined);
    expect(mockPrisma.assistanceRequest.findMany.mock.calls[0]?.[0].where).toEqual({ status: 'pending' });
    await assistance.listAssistanceRequests(false);
    expect(mockPrisma.assistanceRequest.findMany.mock.calls[1]?.[0].where).toEqual({});
  });

  it('resolves assistance with a timestamp and reports missing requests', async () => {
    mockPrisma.assistanceRequest.update.mockResolvedValue({ status: 'resolved' });
    await assistance.resolveAssistanceRequest('request');
    expect(mockPrisma.assistanceRequest.update.mock.calls[0]?.[0].data).toMatchObject({
      status: 'resolved', resolvedAt: expect.any(Date)
    });
    mockPrisma.assistanceRequest.update.mockRejectedValue(prismaError('P2025'));
    await expect(assistance.resolveAssistanceRequest('missing')).rejects.toMatchObject({ status: 404 });
  });
});
