// @ts-nocheck
import { Prisma } from '@prisma/client';
import * as bills from '../../src/services/bills.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

describe('bills service unit tests', () => {
  beforeEach(() => {
    resetPrismaMock();
    mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockPrisma) => unknown) =>
      callback(mockPrisma)
    );
  });

  it('calculates subtotal, rounded tax, and total from snapshotted order prices', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-id',
      items: [
        { unitPrice: new Prisma.Decimal('3.25'), quantity: 2 },
        { unitPrice: new Prisma.Decimal('1.10'), quantity: 1 }
      ]
    });
    mockPrisma.bill.create.mockImplementation(async ({ data }) => data);
    await bills.createBill('order-id');
    const data = mockPrisma.bill.create.mock.calls[0]?.[0].data;
    expect(data.subtotal.toFixed(2)).toBe('7.60');
    expect(data.tax.toFixed(2)).toBe('0.57');
    expect(data.total.toFixed(2)).toBe('8.17');
  });

  it('calculates a zero subtotal and maps missing orders or concurrent unique conflicts', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-id', items: [] });
    mockPrisma.bill.create.mockImplementation(async ({ data }) => data);
    await bills.createBill('order-id');
    expect(mockPrisma.bill.create.mock.calls[0]?.[0].data.total.toFixed(2)).toBe('0.00');
    mockPrisma.order.findUnique.mockResolvedValue(null);
    await expect(bills.createBill('missing')).rejects.toMatchObject({ status: 404 });
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-id', items: [] });
    mockPrisma.bill.create.mockRejectedValue(prismaError('P2002'));
    await expect(bills.createBill('order-id')).rejects.toMatchObject({ status: 409 });
  });

  it('restricts customer bill access and updates bill plus order atomically when paid', async () => {
    mockPrisma.bill.findUnique.mockResolvedValue({
      id: 'bill-id', order: { customerId: 'other' }
    });
    await expect(bills.getBillForOrder('order-id', { id: 'customer', role: 'customer' }))
      .rejects.toMatchObject({ status: 403 });

    mockPrisma.bill.update.mockResolvedValue({ id: 'bill-id', orderId: 'order-id' });
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.bill.findUniqueOrThrow.mockResolvedValue({ id: 'bill-id', paid: true });
    await expect(bills.payBill('bill-id')).resolves.toMatchObject({ paid: true });
    expect(mockPrisma.bill.update.mock.calls[0]?.[0].data).toMatchObject({ paid: true, paidAt: expect.any(Date) });
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-id' }, data: { status: 'paid' }
    });
  });

  it('maps a missing bill during payment to 404', async () => {
    mockPrisma.bill.update.mockRejectedValue(prismaError('P2025'));
    await expect(bills.payBill('missing-bill')).rejects.toMatchObject({ status: 404 });
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });
});
