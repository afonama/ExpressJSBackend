import { z } from 'zod';

export const salesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7)
});

export const topItemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10)
});
