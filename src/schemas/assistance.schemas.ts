import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const createAssistanceSchema = z.object({
  tableId: zUUID,
  type: z.enum(['call_waiter', 'request_bill'])
});

export const listAssistanceQuerySchema = z.object({
  pendingOnly: z.enum(['true', 'false']).default('true').transform((value) => value === 'true')
});

export const assistanceIdParamsSchema = z.object({ id: zUUID });
