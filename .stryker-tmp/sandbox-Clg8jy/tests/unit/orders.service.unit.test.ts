// @ts-nocheck
import * as orders from '../../src/services/orders.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

const tableId = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';
const customer = { id: '00000000-0000-4000-8000-000000000003', role: 'customer' as const };
const item = {
  id: itemId,
  name: 'Tea',
  isAvailable: true,
  stockCount: 2,
  price: { toString: () => '3.50' }
};

function useTransaction(): void {
  mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockPrisma) => unknown) =>
    callback(mockPrisma)
  );
  mockPrisma.$queryRaw.mockImplementation((strings: TemplateStringsArray) =>
    Promise.resolve(strings[0]?.includes('menu_items') ? [{ id: itemId }] : [{ id: 'order-id' }])
  );
}

describe('orders service unit tests', () => {
  beforeEach(() => {
    resetPrismaMock();
    useTransaction();
  });

  it('creates a customer order, locks/decrements stock, and snapshots current price', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: tableId });
    mockPrisma.order.create.mockResolvedValue({ id: 'order-id' });
    mockPrisma.menuItem.findUnique.mockResolvedValue(item);
    mockPrisma.menuItem.update.mockResolvedValue({});
    mockPrisma.orderItem.create.mockResolvedValue({});
    mockPrisma.table.update.mockResolvedValue({});
    mockPrisma.order.findUniqueOrThrow.mockResolvedValue({ id: 'order-id' });

    await orders.createOrder(
      { tableId, items: [{ menuItemId: itemId, quantity: 2 }] },
      customer
    );
    expect(mockPrisma.order.create).toHaveBeenCalledWith({
      data: { tableId, customerId: customer.id }
    });
    expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: { stockCount: { decrement: 2 } }
    });
    expect(mockPrisma.orderItem.create.mock.calls[0]?.[0].data).toMatchObject({
      menuItemId: itemId,
      quantity: 2,
      unitPrice: item.price
    });
    expect(mockPrisma.table.update).toHaveBeenCalledWith({
      where: { id: tableId },
      data: { status: 'occupied' }
    });
  });

  it('rejects missing tables, missing/unavailable menu items, and insufficient stock', async () => {
    mockPrisma.table.findUnique.mockResolvedValue(null);
    await expect(orders.createOrder({ tableId, items: [{ menuItemId: itemId, quantity: 1 }] }, customer))
      .rejects.toMatchObject({ status: 404 });

    mockPrisma.table.findUnique.mockResolvedValue({ id: tableId });
    mockPrisma.order.create.mockResolvedValue({ id: 'order-id' });
    mockPrisma.$queryRaw.mockResolvedValue([]);
    await expect(orders.createOrder({ tableId, items: [{ menuItemId: itemId, quantity: 1 }] }, customer))
      .rejects.toMatchObject({ status: 404 });

    mockPrisma.$queryRaw.mockResolvedValue([{ id: itemId }]);
    mockPrisma.menuItem.findUnique.mockResolvedValue({ ...item, isAvailable: false });
    await expect(orders.createOrder({ tableId, items: [{ menuItemId: itemId, quantity: 1 }] }, customer))
      .rejects.toMatchObject({ status: 400 });
    mockPrisma.menuItem.findUnique.mockResolvedValue(item);
    await expect(orders.createOrder({ tableId, items: [{ menuItemId: itemId, quantity: 3 }] }, customer))
      .rejects.toMatchObject({ status: 400 });
  });

  it('does not decrement unlimited stock and applies customer/status filters', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: tableId });
    mockPrisma.order.create.mockResolvedValue({ id: 'order-id' });
    mockPrisma.menuItem.findUnique.mockResolvedValue({ ...item, stockCount: null });
    mockPrisma.orderItem.create.mockResolvedValue({});
    mockPrisma.table.update.mockResolvedValue({});
    mockPrisma.order.findUniqueOrThrow.mockResolvedValue({ id: 'order-id' });
    await orders.createOrder({ tableId, items: [{ menuItemId: itemId, quantity: 1 }] }, customer);
    expect(mockPrisma.menuItem.update).not.toHaveBeenCalled();

    mockPrisma.order.findMany.mockResolvedValue([]);
    await orders.listOrders({ tableId, activeOnly: true }, customer);
    expect(mockPrisma.order.findMany.mock.calls[0]?.[0].where).toEqual({
      customerId: customer.id, tableId, status: { notIn: ['paid', 'cancelled'] }
    });
  });

  it('enforces ownership and closed-order restrictions on reads and additions', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-id', customerId: 'other' });
    await expect(orders.getOrder('order-id', customer)).rejects.toMatchObject({ status: 403 });

    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-id', customerId: customer.id, status: 'paid' });
    await expect(orders.addOrderItems('order-id', [{ menuItemId: itemId, quantity: 1 }], customer))
      .rejects.toMatchObject({ status: 400 });

    mockPrisma.$queryRaw.mockResolvedValue([]);
    await expect(orders.addOrderItems('missing', [{ menuItemId: itemId, quantity: 1 }], customer))
      .rejects.toMatchObject({ status: 404 });
  });

  it('maps missing orders on status changes', async () => {
    mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.order.findUnique.mockResolvedValue(null);
    await expect(orders.updateOrderStatus('missing', 'ready', 'placed')).rejects.toMatchObject({ status: 404 });
  });

  it('rejects stale order status updates with a conflict', async () => {
    mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-id' });
    await expect(orders.updateOrderStatus('order-id', 'served', 'placed')).rejects.toMatchObject({ status: 409 });
  });
});
