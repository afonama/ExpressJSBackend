// @ts-nocheck
import { Prisma } from '@prisma/client';
import * as analytics from '../../src/services/analytics.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

describe('analytics service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('returns zero-safe summary metrics and fixed-point decimals', async () => {
    mockPrisma.bill.aggregate
      .mockResolvedValueOnce({ _sum: { total: new Prisma.Decimal('12.30') } })
      .mockResolvedValueOnce({ _avg: { total: new Prisma.Decimal('6.15') } });
    mockPrisma.order.count.mockResolvedValue(2);
    await expect(analytics.getSummary()).resolves.toEqual({
      totalRevenue: '12.30', totalOrderCount: 2, averageOrderValue: '6.15'
    });
    mockPrisma.bill.aggregate
      .mockResolvedValueOnce({ _sum: { total: null } })
      .mockResolvedValueOnce({ _avg: { total: null } });
    mockPrisma.order.count.mockResolvedValue(0);
    await expect(analytics.getSummary()).resolves.toEqual({
      totalRevenue: '0.00', totalOrderCount: 0, averageOrderValue: '0.00'
    });
  });

  it('formats daily sales and ranks grouped items while ignoring deleted menu rows', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ day: '2025-01-01', revenue: new Prisma.Decimal('10.25') }]);
    await expect(analytics.getSales(7)).resolves.toEqual([{ day: '2025-01-01', revenue: '10.25' }]);
    mockPrisma.orderItem.groupBy.mockResolvedValue([
      { menuItemId: 'item', _sum: { quantity: 3 } },
      { menuItemId: 'deleted', _sum: { quantity: 2 } }
    ]);
    mockPrisma.menuItem.findMany.mockResolvedValue([{ id: 'item', name: 'Tea' }]);
    await expect(analytics.getTopItems(2)).resolves.toEqual([
      { menuItem: { id: 'item', name: 'Tea' }, quantitySold: 3 }
    ]);
    expect(mockPrisma.orderItem.groupBy.mock.calls[0]?.[0].take).toBe(2);
  });

  it('returns peak-hour SQL results unchanged', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ hour: 13, orderCount: 4 }]);
    await expect(analytics.getPeakHours()).resolves.toEqual([{ hour: 13, orderCount: 4 }]);
  });
});
