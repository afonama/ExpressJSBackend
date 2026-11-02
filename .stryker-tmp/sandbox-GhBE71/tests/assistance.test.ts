// @ts-nocheck
import { randomUUID } from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/assistance';

describe('Assistance resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Assistance Swagger group and documents all endpoints', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./assistance');
    expect(swaggerSpec).toHaveProperty('paths./assistance/{id}/resolve');
  });

  it('allows public creation and restricts listing and resolution to staff', async () => {
    const table = await prisma.table.create({
      data: { number: 44, capacity: 4, qrCode: randomUUID() }
    });
    const { user: waiter } = await createTestUser('waiter');
    const { user: customer } = await createTestUser('customer');
    const waiterToken = signAccessToken(waiter.id, waiter.role);
    const customerToken = signAccessToken(customer.id, customer.role);

    expect((await request(app).post(BASE).send({ tableId: randomUUID(), type: 'call_waiter' })).status).toBe(404);
    const created = await request(app).post(BASE).send({ tableId: table.id, type: 'request_bill' });
    expect(created.status).toBe(201);
    const id = created.body.assistanceRequest.id as string;
    expect(created.body.assistanceRequest.status).toBe('pending');
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${customerToken}`)).status).toBe(403);
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${waiterToken}`)).body.assistanceRequests).toHaveLength(1);

    const resolved = await request(app)
      .patch(`${BASE}/${id}/resolve`)
      .set('Authorization', `Bearer ${waiterToken}`);
    expect(resolved.status).toBe(200);
    expect(resolved.body.assistanceRequest.status).toBe('resolved');
    expect(resolved.body.assistanceRequest.resolvedAt).toBeTruthy();
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${waiterToken}`)).body.assistanceRequests).toHaveLength(0);
    expect(
      (await request(app).get(`${BASE}?pendingOnly=false`).set('Authorization', `Bearer ${waiterToken}`)).body.assistanceRequests
    ).toHaveLength(1);
  });
});
