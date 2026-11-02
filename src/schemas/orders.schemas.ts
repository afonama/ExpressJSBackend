import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const orderItemInputSchema = z.object({
  menuItemId: zUUID,
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(500).nullable().optional()
});

export const createOrderSchema = z.object({
  tableId: zUUID,
  items: z.array(orderItemInputSchema).min(1)
});

export const addOrderItemsSchema = z.object({
  items: z.array(orderItemInputSchema).min(1)
});

export const listOrdersQuerySchema = z.object({
  tableId: zUUID.optional(),
  activeOnly: z.enum(['true', 'false']).transform((value) => value === 'true').optional()
});

export const orderIdParamsSchema = z.object({ id: zUUID });

export const updateOrderStatusSchema = z.object({
  status: z.enum(['placed', 'preparing', 'ready', 'served', 'paid', 'cancelled']),
  expectedStatus: z.enum(['placed', 'preparing', 'ready', 'served', 'paid', 'cancelled'])
});
