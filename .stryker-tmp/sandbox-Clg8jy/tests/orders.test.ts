// @ts-nocheck
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/orders';

async function createCatalog(stockCount: number | null = 10) {
  const table = await prisma.table.create({
    data: { number: Math.floor(Math.random() * 1000000), capacity: 4, qrCode: crypto.randomUUID() }
  });
  const category = await prisma.menuCategory.create({ data: { name: `Category ${crypto.randomUUID()}` } });
  const item = await prisma.menuItem.create({
    data: { categoryId: category.id, name: 'Soup', price: 4.25, stockCount }
  });
  return { table, item };
}

describe('Orders resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Orders Swagger group and documents all endpoints', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./orders');
    expect(swaggerSpec).toHaveProperty('paths./orders/{id}');
    expect(swaggerSpec).toHaveProperty('paths./orders/{id}/items');
    expect(swaggerSpec).toHaveProperty('paths./orders/{id}/status');
  });

  it('creates, filters, reads, adds to, and updates orders with ownership enforced', async () => {
    const { user: customer } = await createTestUser('customer');
    const { user: otherCustomer } = await createTestUser('customer');
    const { user: waiter } = await createTestUser('waiter');
    const customerToken = signAccessToken(customer.id, customer.role);
    const otherCustomerToken = signAccessToken(otherCustomer.id, otherCustomer.role);
    const waiterToken = signAccessToken(waiter.id, waiter.role);
    const { table, item } = await createCatalog();

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ tableId: table.id, items: [{ menuItemId: item.id, quantity: 2 }], unitPrice: 0.01 });
    expect(created.status).toBe(201);
    const orderId = created.body.order.id as string;
    expect(created.body.order.customerId).toBe(customer.id);
    expect(Number(created.body.order.items[0].unitPrice)).toBe(4.25);
    expect((await prisma.table.findUnique({ where: { id: table.id } }))?.status).toBe('occupied');
    expect((await prisma.menuItem.findUnique({ where: { id: item.id } }))?.stockCount).toBe(8);

    expect((await request(app).get(BASE).set('Authorization', `Bearer ${customerToken}`)).body.orders).toHaveLength(1);
    expect(
      (
        await request(app)
          .get(`${BASE}?tableId=${table.id}&activeOnly=true`)
          .set('Authorization', `Bearer ${customerToken}`)
      ).body.orders
    ).toHaveLength(1);
    expect(
      (await request(app).get(`${BASE}/${orderId}`).set('Authorization', `Bearer ${otherCustomerToken}`)).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`${BASE}/${orderId}/items`)
          .set('Authorization', `Bearer ${otherCustomerToken}`)
          .send({ items: [{ menuItemId: item.id, quantity: 1 }] })
      ).status
    ).toBe(403);

    const added = await request(app)
      .post(`${BASE}/${orderId}/items`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ menuItemId: item.id, quantity: 1, notes: 'No croutons' }] });
    expect(added.status).toBe(200);
    expect((await prisma.menuItem.findUnique({ where: { id: item.id } }))?.stockCount).toBe(7);

    expect(
      (await request(app).patch(`${BASE}/${orderId}/status`).set('Authorization', `Bearer ${customerToken}`).send({ status: 'ready', expectedStatus: 'placed' }))
        .status
    ).toBe(403);
    expect(
      (await request(app).patch(`${BASE}/${orderId}/status`).set('Authorization', `Bearer ${waiterToken}`).send({ status: 'ready', expectedStatus: 'placed' }))
        .status
    ).toBe(200);
    expect(
      (await request(app).patch(`${BASE}/${orderId}/status`).set('Authorization', `Bearer ${waiterToken}`).send({ status: 'served', expectedStatus: 'ready' }))
        .status
    ).toBe(200);
    expect(
      (await request(app).get(`${BASE}?tableId=${table.id}&activeOnly=true`).set('Authorization', `Bearer ${customerToken}`))
        .body.orders
    ).toHaveLength(1);
    expect(
      (await request(app).patch(`${BASE}/${orderId}/status`).set('Authorization', `Bearer ${waiterToken}`).send({ status: 'paid', expectedStatus: 'served' }))
        .status
    ).toBe(200);
    expect(
      (await request(app).get(`${BASE}?activeOnly=true`).set('Authorization', `Bearer ${customerToken}`)).body.orders
    ).toHaveLength(0);
    expect(
      (
        await request(app)
          .post(`${BASE}/${orderId}/items`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ items: [{ menuItemId: item.id, quantity: 1 }] })
      ).status
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(`${BASE}/00000000-0000-4000-8000-000000000000/items`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ items: [{ menuItemId: item.id, quantity: 1 }] })
      ).status
    ).toBe(404);
  });

  it('serializes competing orders for the last stock unit', async () => {
    const { user: customer } = await createTestUser('customer');
    const token = signAccessToken(customer.id, customer.role);
    const { table, item } = await createCatalog(1);
    const body = { tableId: table.id, items: [{ menuItemId: item.id, quantity: 1 }] };

    const responses = await Promise.all([
      request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(body),
      request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(body)
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);
    expect(await prisma.menuItem.findUnique({ where: { id: item.id } })).toMatchObject({ stockCount: 0 });
    expect(await prisma.order.count()).toBe(1);
  });

  it('serializes ten concurrent requests against three stock units across repeated runs', async () => {
    const { user: customer } = await createTestUser('customer');
    const token = signAccessToken(customer.id, customer.role);

    for (let run = 0; run < 3; run++) {
      const { table, item } = await createCatalog(3);
      const body = { tableId: table.id, items: [{ menuItemId: item.id, quantity: 1 }] };
      const responses = await Promise.all(
        Array.from({ length: 10 }, () =>
          request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(body)
        )
      );
      const statuses = responses.map((response) => response.status);

      expect(statuses.filter((status) => status === 201)).toHaveLength(3);
      expect(statuses.filter((status) => status === 400)).toHaveLength(7);
      expect(statuses.every((status) => status === 201 || status === 400)).toBe(true);
      expect(await prisma.menuItem.findUnique({ where: { id: item.id } })).toMatchObject({ stockCount: 0 });
      expect(await prisma.order.count({ where: { tableId: table.id } })).toBe(3);
    }
  });

  it('leaves a valid, submitted status after simultaneous order status updates', async () => {
    const { user: firstWaiter } = await createTestUser('waiter');
    const { user: secondWaiter } = await createTestUser('waiter');
    const table = await prisma.table.create({
      data: { number: Math.floor(Math.random() * 1000000), capacity: 4, qrCode: crypto.randomUUID() }
    });
    const order = await prisma.order.create({ data: { tableId: table.id } });

    const responses = await Promise.all([
      request(app)
        .patch(`${BASE}/${order.id}/status`)
        .set('Authorization', `Bearer ${signAccessToken(firstWaiter.id, firstWaiter.role)}`)
        .send({ status: 'ready', expectedStatus: 'placed' }),
      request(app)
        .patch(`${BASE}/${order.id}/status`)
        .set('Authorization', `Bearer ${signAccessToken(secondWaiter.id, secondWaiter.role)}`)
        .send({ status: 'served', expectedStatus: 'placed' })
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const persistedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const successfulResponse = responses.find((response) => response.status === 200);
    expect(['ready', 'served']).toContain(persistedOrder?.status);
    expect(persistedOrder?.status).toBe(successfulResponse?.body.order.status);
  });
});
