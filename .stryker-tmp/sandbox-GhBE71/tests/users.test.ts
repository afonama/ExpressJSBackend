// @ts-nocheck
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { prisma } from '../src/lib/prisma.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/users';

describe('Users resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Users Swagger group and documents all endpoints', async () => {
    expect((await request(app).get('/docs/')).status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./users');
    expect(swaggerSpec).toHaveProperty('paths./users/{id}/deactivate');
    expect(swaggerSpec).toHaveProperty('paths./users/{id}/activate');
  });

  it('allows admins to create, list, deactivate, and activate staff only', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: waiter } = await createTestUser('waiter');
    const { user: customer } = await createTestUser('customer');
    const adminToken = signAccessToken(admin.id, admin.role);
    const waiterToken = signAccessToken(waiter.id, waiter.role);

    expect((await request(app).get(BASE).set('Authorization', `Bearer ${waiterToken}`)).status).toBe(403);
    const invalidRole = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'customer-new@test.dev', password: 'Password123!', name: 'Customer', role: 'customer' });
    expect(invalidRole.status).toBe(400);

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new-waiter@test.dev', password: 'Password123!', name: 'New Waiter', role: 'waiter' });
    expect(created.status).toBe(201);
    expect(created.body.user.hashedPassword).toBeUndefined();
    const staffId = created.body.user.id as string;
    expect((await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`)).body.users).toHaveLength(3);
    expect((await prisma.user.findUnique({ where: { id: customer.id } }))?.role).toBe('customer');

    const deactivated = await request(app)
      .patch(`${BASE}/${staffId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user.isActive).toBe(false);
    const activated = await request(app)
      .patch(`${BASE}/${staffId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(activated.status).toBe(200);
    expect(activated.body.user.isActive).toBe(true);

    expect(
      (await request(app).patch(`${BASE}/00000000-0000-4000-8000-000000000000/activate`).set('Authorization', `Bearer ${adminToken}`))
        .status
    ).toBe(404);
  });
});
