// @ts-nocheck
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/analytics';

describe('Analytics resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Analytics Swagger group and documents all endpoints', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./analytics/summary');
    expect(swaggerSpec).toHaveProperty('paths./analytics/sales');
    expect(swaggerSpec).toHaveProperty('paths./analytics/top-items');
    expect(swaggerSpec).toHaveProperty('paths./analytics/peak-hours');
  });

  it('returns summary, sales, top items, and peak-hour metrics for admins only', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: waiter } = await createTestUser('waiter');
    const adminToken = signAccessToken(admin.id, admin.role);
    const waiterToken = signAccessToken(waiter.id, waiter.role);

    expect((await request(app).get(`${BASE}/summary`).set('Authorization', `Bearer ${waiterToken}`)).status).toBe(403);

    const table = await prisma.table.create({
      data: { number: 12, capacity: 4, qrCode: randomUUID() }
    });
    const category = await prisma.menuCategory.create({ data: { name: `Category ${randomUUID()}` } });
    const firstItem = await prisma.menuItem.create({
      data: { categoryId: category.id, name: 'First item', price: 5 }
    });
    const secondItem = await prisma.menuItem.create({
      data: { categoryId: category.id, name: 'Second item', price: 5 }
    });
    const firstOrder = await prisma.order.create({
      data: {
        tableId: table.id,
        items: {
          create: [
            { menuItemId: firstItem.id, quantity: 2, unitPrice: 5 },
            { menuItemId: secondItem.id, quantity: 1, unitPrice: 5 }
          ]
        },
        bill: { create: { subtotal: 15, tax: 0, total: 15, paid: true, paidAt: new Date() } }
      }
    });
    await prisma.order.create({
      data: {
        tableId: table.id,
        items: { create: { menuItemId: secondItem.id, quantity: 4, unitPrice: 5 } },
        bill: { create: { subtotal: 20, tax: 0, total: 20, paid: true, paidAt: new Date() } }
      }
    });
    await prisma.order.create({ data: { tableId: table.id } });

    const summary = await request(app).get(`${BASE}/summary`).set('Authorization', `Bearer ${adminToken}`);
    expect(summary.status).toBe(200);
    expect(summary.body).toEqual({ totalRevenue: '35.00', totalOrderCount: 3, averageOrderValue: '17.50' });

    const sales = await request(app).get(`${BASE}/sales?days=7`).set('Authorization', `Bearer ${adminToken}`);
    expect(sales.status).toBe(200);
    expect(sales.body.sales).toHaveLength(1);
    expect(sales.body.sales[0].revenue).toBe('35.00');
    expect((await request(app).get(`${BASE}/sales?days=0`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(400);

    const topItems = await request(app)
      .get(`${BASE}/top-items?limit=1`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(topItems.status).toBe(200);
    expect(topItems.body.items).toHaveLength(1);
    expect(topItems.body.items[0].menuItem.id).toBe(secondItem.id);
    expect(topItems.body.items[0].quantitySold).toBe(5);

    const peakHours = await request(app).get(`${BASE}/peak-hours`).set('Authorization', `Bearer ${adminToken}`);
    expect(peakHours.status).toBe(200);
    expect(peakHours.body.peakHours.reduce((sum: number, entry: { orderCount: number }) => sum + entry.orderCount, 0)).toBe(3);
    expect(await prisma.order.findUnique({ where: { id: firstOrder.id } })).not.toBeNull();
  });
});
