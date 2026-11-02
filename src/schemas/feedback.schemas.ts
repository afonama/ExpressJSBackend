import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const createFeedbackSchema = z.object({
  orderId: zUUID,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional()
});
