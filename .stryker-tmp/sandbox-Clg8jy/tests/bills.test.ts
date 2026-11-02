// @ts-nocheck
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/bills';

async function createOrder() {
  const table = await prisma.table.create({
    data: { number: Math.floor(Math.random() * 1000000), capacity: 4, qrCode: randomUUID() }
  });
  const category = await prisma.menuCategory.create({ data: { name: `Category ${randomUUID()}` } });
  const item = await prisma.menuItem.create({
    data: { categoryId: category.id, name: 'Soup', price: 4.25 }
  });
  return prisma.order.create({
    data: {
      tableId: table.id,
      items: { create: { menuItemId: item.id, quantity: 3, unitPrice: item.price } }
    }
  });
}

describe('Bills resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Bills Swagger group and documents all endpoints', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./bills/order/{orderId}');
    expect(swaggerSpec).toHaveProperty('paths./bills/{id}/pay');
  });

  it('generates, reads, and pays bills with ownership and role checks', async () => {
    const { user: customer } = await createTestUser('customer');
    const { user: otherCustomer } = await createTestUser('customer');
    const { user: waiter } = await createTestUser('waiter');
    const customerToken = signAccessToken(customer.id, customer.role);
    const otherCustomerToken = signAccessToken(otherCustomer.id, otherCustomer.role);
    const waiterToken = signAccessToken(waiter.id, waiter.role);
    const order = await createOrder();
    await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id } });

    expect(
      (await request(app).post(`${BASE}/order/${order.id}`).set('Authorization', `Bearer ${customerToken}`)).status
    ).toBe(403);
    const created = await request(app)
      .post(`${BASE}/order/${order.id}`)
      .set('Authorization', `Bearer ${waiterToken}`);
    expect(created.status).toBe(201);
    expect(Number(created.body.bill.subtotal)).toBe(12.75);
    expect(Number(created.body.bill.tax)).toBe(Number((12.75 * env.taxRate).toFixed(2)));
    expect(Number(created.body.bill.total)).toBe(Number((12.75 * (1 + env.taxRate)).toFixed(2)));

    expect((await request(app).get(`${BASE}/order/${order.id}`).set('Authorization', `Bearer ${customerToken}`)).status).toBe(200);
    expect(
      (await request(app).get(`${BASE}/order/${order.id}`).set('Authorization', `Bearer ${otherCustomerToken}`)).status
    ).toBe(403);
    expect(
      (await request(app).patch(`${BASE}/${created.body.bill.id}/pay`).set('Authorization', `Bearer ${customerToken}`)).status
    ).toBe(403);

    const paid = await request(app)
      .patch(`${BASE}/${created.body.bill.id}/pay`)
      .set('Authorization', `Bearer ${waiterToken}`);
    expect(paid.status).toBe(200);
    expect(paid.body.bill.paid).toBe(true);
    expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('paid');
  });

  it('converts concurrent bill unique-constraint races to one 201 and one 409', async () => {
    const { user: waiter } = await createTestUser('waiter');
    const token = signAccessToken(waiter.id, waiter.role);
    const order = await createOrder();
    const responses = await Promise.all([
      request(app).post(`${BASE}/order/${order.id}`).set('Authorization', `Bearer ${token}`),
      request(app).post(`${BASE}/order/${order.id}`).set('Authorization', `Bearer ${token}`)
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await prisma.bill.count({ where: { orderId: order.id } })).toBe(1);
  });
});
