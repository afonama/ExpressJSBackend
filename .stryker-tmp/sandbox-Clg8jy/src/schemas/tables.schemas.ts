// @ts-nocheck
import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const tableStatusValues = ['free', 'occupied', 'reserved', 'needs_bill'] as const;

export const createTableSchema = z.object({
  number: z.coerce.number().int().positive(),
  capacity: z.coerce.number().int().positive().default(4)
});

export const updateTableSchema = z
  .object({
    capacity: z.coerce.number().int().positive().optional(),
    status: z.enum(tableStatusValues).optional(),
    expectedStatus: z.enum(tableStatusValues).optional()
  })
  .refine((data) => data.capacity !== undefined || data.status !== undefined, {
    message: 'At least one of capacity or status must be provided'
  })
  .refine((data) => data.status === undefined || data.expectedStatus !== undefined, {
    message: 'expectedStatus is required when changing status'
  });

export const tableIdParamsSchema = z.object({ id: zUUID });
export const qrCodeParamsSchema = z.object({ qrCode: z.string().min(1) });