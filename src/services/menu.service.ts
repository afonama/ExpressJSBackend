import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, notFound } from '../errors.js';
import type {
  createCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema
} from '../schemas/menu.schemas.js';
import type { z } from 'zod';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

export async function createCategory(data: CreateCategoryInput) {
  try {
    return await prisma.menuCategory.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw conflict('A category with this name already exists');
    }
    throw err;
  }
}

export async function listCategories() {
  return prisma.menuCategory.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await prisma.menuCategory.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Category not found');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw conflict('Category contains menu items used by orders');
    }
    throw err;
  }
}

export async function createMenuItem(data: CreateMenuItemInput) {
  const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw notFound('Menu category not found');

  const { price, ...rest } = data;
  try {
    return await prisma.menuItem.create({
      data: { ...rest, price: new Prisma.Decimal(price) }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw notFound('Menu category not found');
    }
    throw err;
  }
}

export async function listMenuItems(filters: { categoryId?: string; availableOnly?: boolean }) {
  return prisma.menuItem.findMany({
    where: {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.availableOnly ? { isAvailable: true } : {})
    },
    orderBy: { name: 'asc' }
  });
}

export async function listLowStockItems() {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM menu_items
    WHERE stock_count IS NOT NULL AND stock_count <= low_stock_threshold`;
  return prisma.menuItem.findMany({ where: { id: { in: rows.map((row) => row.id) } } });
}

export async function updateMenuItem(id: string, data: UpdateMenuItemInput) {
  try {
    return await prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {})
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Menu item not found');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw notFound('Menu category not found');
    }
    throw err;
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await prisma.menuItem.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('Menu item not found');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw conflict('Menu item is used by an order');
    }
    throw err;
  }
}
