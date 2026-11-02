import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function getSummary() {
  const [revenue, orderCount, average] = await Promise.all([
    prisma.bill.aggregate({ where: { paid: true }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.bill.aggregate({ where: { paid: true }, _avg: { total: true } })
  ]);

  return {
    totalRevenue: revenue._sum.total?.toFixed(2) ?? '0.00',
    totalOrderCount: orderCount,
    averageOrderValue: average._avg.total?.toFixed(2) ?? '0.00'
  };
}

export async function getSales(days = 7) {
  const rows = await prisma.$queryRaw<Array<{ day: string; revenue: Prisma.Decimal }>>`
    SELECT to_char(date_trunc('day', paid_at), 'YYYY-MM-DD') AS day,
           SUM(total) AS revenue
    FROM bills
    WHERE paid = TRUE
      AND paid_at >= NOW() - (${days}::int * INTERVAL '1 day')
    GROUP BY date_trunc('day', paid_at)
    ORDER BY date_trunc('day', paid_at)
  `;
  return rows.map((row) => ({ day: row.day, revenue: row.revenue.toFixed(2) }));
}

export async function getTopItems(limit = 10) {
  const quantities = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit
  });
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: quantities.map((row) => row.menuItemId) } }
  });
  const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

  return quantities.flatMap((row) => {
    const menuItem = menuItemById.get(row.menuItemId);
    return menuItem ? [{ menuItem, quantitySold: row._sum.quantity ?? 0 }] : [];
  });
}

export async function getPeakHours() {
  return prisma.$queryRaw<Array<{ hour: number; orderCount: number }>>`
    SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS "orderCount"
    FROM orders
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY EXTRACT(HOUR FROM created_at)
  `;
}
