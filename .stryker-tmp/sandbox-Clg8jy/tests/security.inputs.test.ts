// @ts-nocheck
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const API = '/api/v1';
const id = '00000000-0000-4000-8000-000000000001';

const bodyEndpoints = [
  ['post', `${API}/auth/signup`],
  ['post', `${API}/auth/login`],
  ['post', `${API}/auth/refresh`],
  ['post', `${API}/auth/logout`],
  ['post', `${API}/tables`],
  ['patch', `${API}/tables/${id}`],
  ['post', `${API}/menu/categories`],
  ['post', `${API}/menu/items`],
  ['patch', `${API}/menu/items/${id}`],
  ['post', `${API}/users`],
  ['post', `${API}/orders`],
  ['post', `${API}/orders/${id}/items`],
  ['patch', `${API}/orders/${id}/status`],
  ['post', `${API}/bills/order/${id}`],
  ['patch', `${API}/bills/${id}/pay`],
  ['post', `${API}/assistance`],
  ['patch', `${API}/assistance/${id}/resolve`],
  ['post', `${API}/feedback`]
] as const;

function send(method: (typeof bodyEndpoints)[number][0], path: string, body: string) {
  const call = method === 'post' ? request(app).post(path) : request(app).patch(path);
  return call.set('Content-Type', 'application/json').send(body);
}

describe('Security: request parser boundaries on body endpoints', () => {
  it.each(bodyEndpoints)('%s %s rejects malformed JSON cleanly', async (method, path) => {
    const response = await send(method, path, '{"malformed":');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_JSON');
  });

  it.each(bodyEndpoints)('%s %s rejects a 10 MB body before route handling', async (method, path) => {
    const oversizedBody = JSON.stringify({ value: 'x'.repeat(10 * 1024 * 1024) });
    const response = await send(method, path, oversizedBody);
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(JSON.stringify(response.body)).not.toMatch(/stack|DATABASE_URL|node_modules/i);
  });
});

describe('Security: structured injection inputs', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('rejects object/operator payloads in user-controlled text fields', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: customer } = await createTestUser('customer');
    const token = signAccessToken(admin.id, admin.role);
    const customerToken = signAccessToken(customer.id, customer.role);
    const operator = { $ne: null };
    const categoryRecord = await prisma.menuCategory.create({ data: { name: `Category ${randomUUID()}` } });
    const itemRecord = await prisma.menuItem.create({
      data: { categoryId: categoryRecord.id, name: 'Test item', price: 2 }
    });
    const tableRecord = await prisma.table.create({
      data: { number: 927, capacity: 4, qrCode: randomUUID() }
    });
    const orderRecord = await prisma.order.create({
      data: {
        tableId: tableRecord.id,
        customerId: customer.id,
        items: { create: { menuItemId: itemRecord.id, quantity: 1, unitPrice: itemRecord.price } }
      }
    });
    const category = await request(app)
      .post(`${API}/menu/categories`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: operator });
    expect(category.status).toBe(400);

    const menuTextFields = await Promise.all([
      request(app).post(`${API}/menu/items`).set('Authorization', `Bearer ${token}`)
        .send({ categoryId: categoryRecord.id, name: 'Item', description: operator, price: 2 }),
      request(app).post(`${API}/menu/items`).set('Authorization', `Bearer ${token}`)
        .send({ categoryId: categoryRecord.id, name: 'Item', tags: [operator], price: 2 }),
      request(app).post(`${API}/menu/items`).set('Authorization', `Bearer ${token}`)
        .send({ categoryId: categoryRecord.id, name: operator, price: 2 }),
      request(app).patch(`${API}/menu/items/${itemRecord.id}`).set('Authorization', `Bearer ${token}`)
        .send({ description: operator })
    ]);
    expect(menuTextFields.map((response) => response.status)).toEqual(Array(4).fill(400));

    const staff = await request(app)
      .post(`${API}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `${Date.now()}@test.dev`, password: 'Password123!', name: operator, role: 'waiter' });
    expect(staff.status).toBe(400);

    const inputFields = await Promise.all([
      request(app).post(`${API}/auth/signup`).send({
        email: `${randomUUID()}@test.dev`, password: 'Password123!', name: operator
      }),
      request(app).post(`${API}/orders`).set('Authorization', `Bearer ${customerToken}`).send({
        tableId: tableRecord.id,
        items: [{ menuItemId: itemRecord.id, quantity: 1, notes: operator }]
      }),
      request(app).post(`${API}/feedback`).set('Authorization', `Bearer ${customerToken}`).send({
        orderId: orderRecord.id, rating: 5, comment: operator
      })
    ]);
    expect(inputFields.map((response) => response.status)).toEqual(Array(3).fill(400));
  });

  it('rejects SQL operators in UUID and numeric query filters', async () => {
    const { user: admin } = await createTestUser('admin');
    const token = signAccessToken(admin.id, admin.role);
    const injection = encodeURIComponent(`' OR 1=1 --`);
    const idInjection = encodeURIComponent(`' OR 1=1; DROP TABLE users; --`);
    const responses = await Promise.all([
      request(app).get(`${API}/menu/items?categoryId=${injection}`),
      request(app).get(`${API}/orders?tableId=${injection}`).set('Authorization', `Bearer ${token}`),
      request(app).get(`${API}/orders?activeOnly=${injection}`).set('Authorization', `Bearer ${token}`),
      request(app).get(`${API}/assistance?pendingOnly=${injection}`).set('Authorization', `Bearer ${token}`),
      request(app).get(`${API}/analytics/sales?days=${injection}`).set('Authorization', `Bearer ${token}`),
      request(app).get(`${API}/analytics/top-items?limit=${injection}`).set('Authorization', `Bearer ${token}`)
    ]);
    expect(responses.map((response) => response.status)).toEqual(Array(6).fill(400));
    expect(responses.map((response) => response.body.error.code)).toEqual(Array(6).fill('VALIDATION_ERROR'));

    const pathResponses = await Promise.all([
      request(app).delete(`${API}/menu/categories/${idInjection}`).set('Authorization', `Bearer ${token}`),
      request(app).patch(`${API}/menu/items/${idInjection}`).set('Authorization', `Bearer ${token}`).send({ name: 'x' }),
      request(app).delete(`${API}/menu/items/${idInjection}`).set('Authorization', `Bearer ${token}`),
      request(app).patch(`${API}/users/${idInjection}/activate`).set('Authorization', `Bearer ${token}`),
      request(app).patch(`${API}/users/${idInjection}/deactivate`).set('Authorization', `Bearer ${token}`),
      request(app).get(`${API}/orders/${idInjection}`).set('Authorization', `Bearer ${token}`),
      request(app).post(`${API}/orders/${idInjection}/items`).set('Authorization', `Bearer ${token}`).send({ items: [] }),
      request(app).patch(`${API}/orders/${idInjection}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'ready', expectedStatus: 'placed' }),
      request(app).get(`${API}/bills/order/${idInjection}`).set('Authorization', `Bearer ${token}`),
      request(app).patch(`${API}/bills/${idInjection}/pay`).set('Authorization', `Bearer ${token}`),
      request(app).patch(`${API}/assistance/${idInjection}/resolve`).set('Authorization', `Bearer ${token}`)
    ]);
    expect(pathResponses.map((response) => response.status)).toEqual(Array(11).fill(400));
    expect(pathResponses.map((response) => response.body.error.code)).toEqual(Array(11).fill('VALIDATION_ERROR'));
  });
});
