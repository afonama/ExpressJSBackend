import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { conflict, forbidden, notFound } from '../errors.js';
import type { AuthUser } from '../types/index.js';

type BillAccess = Pick<AuthUser, 'id' | 'role'>;

const billIncludes = { order: { include: { table: true, items: { include: { menuItem: true } } } } } satisfies Prisma.BillInclude;

export async function createBill(orderId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (!order) throw notFound('Order not found');

      const subtotal = order.items.reduce(
        (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0)
      );
      const tax = subtotal.mul(env.taxRate).toDecimalPlaces(2);
      const total = subtotal.plus(tax);

      return tx.bill.create({
        data: { orderId, subtotal, tax, total },
        include: billIncludes
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw conflict('A bill already exists for this order');
    }
    throw err;
  }
}

export async function getBillForOrder(orderId: string, user: BillAccess) {
  const bill = await prisma.bill.findUnique({
    where: { orderId },
    include: billIncludes
  });
  if (!bill) throw notFound('Bill not found');
  if (user.role === 'customer' && bill.order.customerId !== user.id) {
    throw forbidden('You can only view bills for your own orders');
  }
  return bill;
}

export async function payBill(id: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id } });
      if (!bill) throw notFound('Bill not found');
      if (bill.paid) throw conflict('Bill is already paid');

      await tx.bill.update({
        where: { id },
        data: { paid: true, paidAt: new Date() }
      });
      await tx.order.update({ where: { id: bill.orderId }, data: { status: 'paid' } });
      return tx.bill.findUniqueOrThrow({ where: { id }, include: billIncludes });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Bill not found');
    }
    throw err;
  }
}
