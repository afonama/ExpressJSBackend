// @ts-nocheck
import { Prisma } from '@prisma/client';
import * as menu from '../../src/services/menu.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

describe('menu service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('creates and lists categories and maps duplicate names', async () => {
    mockPrisma.menuCategory.create.mockResolvedValue({ id: 'category' });
    await expect(menu.createCategory({ name: 'Food', sortOrder: 0 })).resolves.toEqual({ id: 'category' });
    mockPrisma.menuCategory.findMany.mockResolvedValue([]);
    await menu.listCategories();
    expect(mockPrisma.menuCategory.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: 'asc' } });
    mockPrisma.menuCategory.create.mockRejectedValue(prismaError('P2002'));
    await expect(menu.createCategory({ name: 'Food', sortOrder: 0 })).rejects.toMatchObject({ status: 409 });
  });

  it('deletes categories and maps missing or referenced records', async () => {
    mockPrisma.menuCategory.delete.mockResolvedValue({});
    await expect(menu.deleteCategory('category')).resolves.toBeUndefined();
    mockPrisma.menuCategory.delete.mockRejectedValue(prismaError('P2025'));
    await expect(menu.deleteCategory('missing')).rejects.toMatchObject({ status: 404 });
    mockPrisma.menuCategory.delete.mockRejectedValue(prismaError('P2003'));
    await expect(menu.deleteCategory('referenced')).rejects.toMatchObject({ status: 409 });
  });

  it('requires an existing category and stores menu prices as decimals', async () => {
    mockPrisma.menuCategory.findUnique.mockResolvedValue(null);
    await expect(menu.createMenuItem({
      categoryId: 'missing', name: 'Tea', price: 2, isAvailable: true, tags: [], lowStockThreshold: 5
    })).rejects.toMatchObject({ status: 404 });
    mockPrisma.menuCategory.findUnique.mockResolvedValue({ id: 'category' });
    mockPrisma.menuItem.create.mockResolvedValue({ id: 'item' });
    await menu.createMenuItem({
      categoryId: 'category', name: 'Tea', price: 2, isAvailable: true, tags: [], lowStockThreshold: 5
    });
    expect(mockPrisma.menuItem.create.mock.calls[0]?.[0].data.price).toEqual(new Prisma.Decimal(2));
  });

  it('filters available menu items and lists low-stock IDs returned by SQL', async () => {
    mockPrisma.menuItem.findMany.mockResolvedValue([]);
    await menu.listMenuItems({ categoryId: 'category', availableOnly: true });
    expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
      where: { categoryId: 'category', isAvailable: true },
      orderBy: { name: 'asc' }
    });
    mockPrisma.$queryRaw.mockResolvedValue([{ id: 'item-1' }, { id: 'item-2' }]);
    await menu.listLowStockItems();
    expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({ where: { id: { in: ['item-1', 'item-2'] } } });
    mockPrisma.$queryRaw.mockResolvedValue([]);
    await menu.listLowStockItems();
    expect(mockPrisma.menuItem.findMany).toHaveBeenLastCalledWith({ where: { id: { in: [] } } });
  });

  it('updates decimal prices and handles missing/dependent items', async () => {
    mockPrisma.menuItem.update.mockResolvedValue({ id: 'item', price: new Prisma.Decimal(3) });
    await menu.updateMenuItem('item', { price: 3 });
    expect(mockPrisma.menuItem.update.mock.calls[0]?.[0].data.price).toEqual(new Prisma.Decimal(3));
    mockPrisma.menuItem.update.mockRejectedValue(prismaError('P2025'));
    await expect(menu.updateMenuItem('missing', { name: 'x' })).rejects.toMatchObject({ status: 404 });
    mockPrisma.menuItem.update.mockRejectedValue(prismaError('P2003'));
    await expect(menu.updateMenuItem('item', { categoryId: 'missing' })).rejects.toMatchObject({ status: 404 });
    mockPrisma.menuItem.delete.mockRejectedValue(prismaError('P2003'));
    await expect(menu.deleteMenuItem('referenced')).rejects.toMatchObject({ status: 409 });
  });
});
