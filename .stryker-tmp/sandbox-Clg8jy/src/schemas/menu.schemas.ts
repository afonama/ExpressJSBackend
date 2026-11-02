// @ts-nocheck
import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.coerce.number().int().default(0)
});

export const categoryIdParamsSchema = z.object({ id: zUUID });

export const createMenuItemSchema = z.object({
  categoryId: zUUID,
  name: z.string().trim().min(1).max(150),
  description: z.string().max(2000).nullable().optional(),
  price: z.coerce.number().positive(),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().default(true),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  stockCount: z.coerce.number().int().nonnegative().nullable().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5)
});

export const listMenuItemsQuerySchema = z.object({
  categoryId: zUUID.optional(),
  availableOnly: z.enum(['true', 'false']).transform((value) => value === 'true').optional()
});

export const updateMenuItemSchema = z
  .object({
    categoryId: zUUID.optional(),
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().max(2000).nullable().optional(),
    price: z.coerce.number().positive().optional(),
    imageUrl: z.string().url().nullable().optional(),
    isAvailable: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(50)).optional(),
    stockCount: z.coerce.number().int().nonnegative().nullable().optional(),
    lowStockThreshold: z.coerce.number().int().nonnegative().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  });

export const menuItemIdParamsSchema = z.object({ id: zUUID });
