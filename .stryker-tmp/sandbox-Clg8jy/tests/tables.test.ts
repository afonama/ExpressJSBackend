// @ts-nocheck
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/tables';

describe('Tables integration tests', () => {
  beforeEach(cleanDb);

  it('documents all table endpoints in Swagger', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./tables');
    expect(swaggerSpec).toHaveProperty('paths./tables/by-qr/{qrCode}');
    expect(swaggerSpec).toHaveProperty('paths./tables/{id}');
  });

  it('creates, lists, looks up, updates, and deletes tables with role enforcement', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: waiter } = await createTestUser('waiter');
    const { user: customer } = await createTestUser('customer');
    const adminToken = signAccessToken(admin.id, admin.role);
    const waiterToken = signAccessToken(waiter.id, waiter.role);
    const customerToken = signAccessToken(customer.id, customer.role);
    const number = 1200;

    expect((await request(app).post(BASE).send({ number })).status).toBe(401);
    expect((await request(app).post(BASE).set('Authorization', `Bearer ${customerToken}`).send({ number })).status)
      .toBe(403);
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ number, capacity: 4 });
    expect(created.status).toBe(201);
    const { id, qrCode } = created.body.table as { id: string; qrCode: string };
    expect(qrCode).toEqual(expect.any(String));

    expect((await request(app).post(BASE).set('Authorization', `Bearer ${adminToken}`).send({ number })).status)
      .toBe(409);
    expect((await request(app).get(BASE)).status).toBe(401);
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${waiterToken}`)).body.tables).toHaveLength(1);

    expect((await request(app).get(`${BASE}/by-qr/${qrCode}`)).body.table.id).toBe(id);
    expect((await request(app).get(`${BASE}/by-qr/${randomUUID()}`)).status).toBe(404);
    expect(
      (await request(app).patch(`${BASE}/${id}`).set('Authorization', `Bearer ${customerToken}`).send({ capacity: 2 }))
        .status
    ).toBe(403);
    const updated = await request(app)
      .patch(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${waiterToken}`)
      .send({ capacity: 6, status: 'occupied', expectedStatus: 'free' });
    expect(updated.status).toBe(200);
    expect(updated.body.table).toMatchObject({ capacity: 6, status: 'occupied' });

    expect((await request(app).delete(`${BASE}/${id}`).set('Authorization', `Bearer ${waiterToken}`)).status).toBe(403);
    expect((await request(app).delete(`${BASE}/${id}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(204);
    expect(await prisma.table.findUnique({ where: { id } })).toBeNull();
  });

  it('rejects a stale simultaneous table status update instead of silently overwriting it', async () => {
    const { user: firstWaiter } = await createTestUser('waiter');
    const { user: secondWaiter } = await createTestUser('waiter');
    const table = await prisma.table.create({
      data: { number: 1201, capacity: 4, qrCode: randomUUID() }
    });

    const responses = await Promise.all([
      request(app)
        .patch(`${BASE}/${table.id}`)
        .set('Authorization', `Bearer ${signAccessToken(firstWaiter.id, firstWaiter.role)}`)
        .send({ status: 'reserved', expectedStatus: 'free' }),
      request(app)
        .patch(`${BASE}/${table.id}`)
        .set('Authorization', `Bearer ${signAccessToken(secondWaiter.id, secondWaiter.role)}`)
        .send({ status: 'needs_bill', expectedStatus: 'free' })
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const persisted = await prisma.table.findUnique({ where: { id: table.id } });
    const successfulResponse = responses.find((response) => response.status === 200);
    expect(['reserved', 'needs_bill']).toContain(persisted?.status);
    expect(persisted?.status).toBe(successfulResponse?.body.table.status);
  });
});
