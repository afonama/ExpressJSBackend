// @ts-nocheck
import { Prisma } from '@prisma/client';
import * as feedback from '../../src/services/feedback.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

describe('feedback service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('rejects missing orders and feedback submitted for another customer order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);
    await expect(feedback.createFeedback(
      { orderId: 'missing', rating: 5 }, { id: 'customer', role: 'customer' }
    )).rejects.toMatchObject({ status: 404 });
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order', customerId: 'another' });
    await expect(feedback.createFeedback(
      { orderId: 'order', rating: 5 }, { id: 'customer', role: 'customer' }
    )).rejects.toMatchObject({ status: 403 });
  });

  it('creates feedback, handles duplicate-order races, and lists feedback', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order', customerId: 'customer' });
    mockPrisma.feedback.create.mockResolvedValue({ id: 'feedback', rating: 5 });
    await expect(feedback.createFeedback(
      { orderId: 'order', rating: 5, comment: 'Great' }, { id: 'customer', role: 'customer' }
    )).resolves.toMatchObject({ rating: 5 });
    mockPrisma.feedback.create.mockRejectedValue(prismaError('P2002'));
    await expect(feedback.createFeedback(
      { orderId: 'order', rating: 5 }, { id: 'customer', role: 'customer' }
    )).rejects.toMatchObject({ status: 409 });
    mockPrisma.feedback.findMany.mockResolvedValue([]);
    await feedback.listFeedback();
    expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith({
      include: { order: { include: { table: true } } }, orderBy: { createdAt: 'desc' }
    });
  });
});
