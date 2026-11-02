import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, forbidden, notFound } from '../errors.js';
import type { AuthUser } from '../types/index.js';
import type { createFeedbackSchema } from '../schemas/feedback.schemas.js';
import type { z } from 'zod';

type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
type FeedbackAccess = Pick<AuthUser, 'id' | 'role'>;

export async function createFeedback(input: CreateFeedbackInput, user: FeedbackAccess) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, customerId: true }
  });
  if (!order) throw notFound('Order not found');
  if (user.role === 'customer' && order.customerId !== user.id) {
    throw forbidden('You can only submit feedback for your own orders');
  }

  try {
    return await prisma.feedback.create({
      data: {
        orderId: input.orderId,
        rating: input.rating,
        comment: input.comment
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') throw conflict('Feedback already exists for this order');
      if (err.code === 'P2003') throw notFound('Order not found');
    }
    throw err;
  }
}

export async function listFeedback() {
  return prisma.feedback.findMany({
    include: { order: { include: { table: true } } },
    orderBy: { createdAt: 'desc' }
  });
}
