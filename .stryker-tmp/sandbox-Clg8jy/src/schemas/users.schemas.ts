// @ts-nocheck
import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const createStaffUserSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100),
  role: z.enum(['admin', 'waiter'])
});

export const userIdParamsSchema = z.object({ id: zUUID });
