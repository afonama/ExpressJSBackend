import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../errors.js';
import type { AuthUser } from '../types/index.js';
import type { orderItemInputSchema } from '../schemas/orders.schemas.js';
import type { z } from 'zod';

type OrderItemInput = z.infer<typeof orderItemInputSchema>;
type OrderAccess = Pick<AuthUser, 'id' | 'role'>;

const orderIncludes = {
  table: true,
  items: { include: { menuItem: true } },
  bill: true
} satisfies Prisma.OrderInclude;

export async function createOrder(
  input: { tableId: string; items: OrderItemInput[] },
  user: OrderAccess
) {
  return prisma.$transaction(async (tx) => {
    const table = await tx.table.findUnique({ where: { id: input.tableId } });
    if (!table) throw notFound('Table not found');

    const order = await tx.order.create({
      data: {
        tableId: input.tableId,
        ...(user.role === 'customer' ? { customerId: user.id } : {}),
        ...((user.role === 'waiter' || user.role === 'admin') ? { waiterId: user.id } : {})
      }
    });

    await addItemsWithStockLock(tx, order.id, input.items);
    await tx.table.update({ where: { id: input.tableId }, data: { status: 'occupied' } });

    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderIncludes });
  });
}

export async function listOrders(
  filters: { tableId?: string; activeOnly?: boolean },
  user: OrderAccess
) {
  return prisma.order.findMany({
    where: {
      ...(user.role === 'customer' ? { customerId: user.id } : {}),
      ...(filters.tableId ? { tableId: filters.tableId } : {}),
      ...(filters.activeOnly ? { status: { notIn: ['paid', 'cancelled'] } } : {})
    },
    include: orderIncludes,
    orderBy: { createdAt: 'desc' }
  });
}

export async function getOrder(id: string, user: OrderAccess) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderIncludes });
  if (!order) throw notFound('Order not found');
  if (user.role === 'customer' && order.customerId !== user.id) {
    throw forbidden('You can only view your own orders');
  }
  return order;
}

export async function addOrderItems(id: string, items: OrderItemInput[], user: OrderAccess) {
  return prisma.$transaction(async (tx) => {
    const lockedOrders = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM orders WHERE id = ${id}::uuid FOR UPDATE
    `;
    if (lockedOrders.length === 0) throw notFound('Order not found');

    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw notFound('Order not found');
    if (user.role === 'customer' && order.customerId !== user.id) {
      throw forbidden('You can only modify your own orders');
    }
    if (order.status === 'paid' || order.status === 'cancelled') {
      throw badRequest('Cannot add items to a paid or cancelled order');
    }

    await addItemsWithStockLock(tx, id, items);
    return tx.order.findUniqueOrThrow({ where: { id }, include: orderIncludes });
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus, expectedStatus: OrderStatus) {
  const updated = await prisma.order.updateMany({
    where: { id, status: expectedStatus },
    data: { status }
  });
  if (updated.count === 0) {
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) throw notFound('Order not found');
    throw conflict('Order status changed; reload the order before retrying');
  }
  return prisma.order.findUniqueOrThrow({ where: { id }, include: orderIncludes });
}

async function addItemsWithStockLock(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: OrderItemInput[]
): Promise<void> {
  const orderedItems = [...items].sort((a, b) => a.menuItemId.localeCompare(b.menuItemId));

  for (const requestedItem of orderedItems) {
    const lockedItems = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM menu_items WHERE id = ${requestedItem.menuItemId}::uuid FOR UPDATE
    `;
    if (lockedItems.length === 0) throw notFound('Menu item not found');

    const menuItem = await tx.menuItem.findUnique({ where: { id: requestedItem.menuItemId } });
    if (!menuItem) throw notFound('Menu item not found');
    if (!menuItem.isAvailable) throw badRequest(`Menu item "${menuItem.name}" is unavailable`);
    if (menuItem.stockCount !== null && menuItem.stockCount < requestedItem.quantity) {
      throw badRequest(`Insufficient stock for menu item "${menuItem.name}"`);
    }

    if (menuItem.stockCount !== null) {
      await tx.menuItem.update({
        where: { id: menuItem.id },
        data: { stockCount: { decrement: requestedItem.quantity } }
      });
    }

    await tx.orderItem.create({
      data: {
        orderId,
        menuItemId: menuItem.id,
        quantity: requestedItem.quantity,
        notes: requestedItem.notes,
        unitPrice: menuItem.price
      }
    });
  }
}
