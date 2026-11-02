// @ts-nocheck
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/feedback';

async function createOrder(customerId: string) {
  const table = await prisma.table.create({
    data: { number: Math.floor(Math.random() * 1000000), capacity: 4, qrCode: randomUUID() }
  });
  return prisma.order.create({ data: { tableId: table.id, customerId } });
}

describe('Feedback resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Feedback Swagger group and documents both endpoints', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./feedback');
  });

  it('validates ownership and rating, prevents duplicate feedback, and restricts listing', async () => {
    const { user: customer } = await createTestUser('customer');
    const { user: otherCustomer } = await createTestUser('customer');
    const { user: admin } = await createTestUser('admin');
    const customerToken = signAccessToken(customer.id, customer.role);
    const otherCustomerToken = signAccessToken(otherCustomer.id, otherCustomer.role);
    const adminToken = signAccessToken(admin.id, admin.role);
    const order = await createOrder(customer.id);

    expect(
      (await request(app).post(BASE).set('Authorization', `Bearer ${customerToken}`).send({ orderId: order.id, rating: 6 }))
        .status
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(BASE)
          .set('Authorization', `Bearer ${otherCustomerToken}`)
          .send({ orderId: order.id, rating: 5 })
      ).status
    ).toBe(403);

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: order.id, rating: 5, comment: 'Great' });
    expect(created.status).toBe(201);
    expect(
      (await request(app).post(BASE).set('Authorization', `Bearer ${customerToken}`).send({ orderId: order.id, rating: 4 }))
        .status
    ).toBe(409);
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${customerToken}`)).status).toBe(403);
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`)).body.feedback).toHaveLength(1);
  });
});
