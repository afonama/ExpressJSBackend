// @ts-nocheck
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { swaggerSpec } from '../src/config/swagger.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const BASE = '/api/v1/menu';

describe('Menu resources', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('serves the Menu Swagger group and documents each endpoint', async () => {
    const docs = await request(app).get('/docs/');
    expect(docs.status).toBe(200);
    expect(swaggerSpec).toHaveProperty('paths./menu/categories');
    expect(swaggerSpec).toHaveProperty('paths./menu/categories/{id}');
    expect(swaggerSpec).toHaveProperty('paths./menu/items');
    expect(swaggerSpec).toHaveProperty('paths./menu/items/low-stock');
    expect(swaggerSpec).toHaveProperty('paths./menu/items/{id}');
  });

  it('supports public listing and admin category/item management', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: customer } = await createTestUser('customer');
    const adminToken = signAccessToken(admin.id, admin.role);
    const customerToken = signAccessToken(customer.id, customer.role);

    expect((await request(app).post(`${BASE}/categories`).send({ name: 'Drinks' })).status).toBe(401);
    expect(
      (await request(app).post(`${BASE}/categories`).set('Authorization', `Bearer ${customerToken}`).send({ name: 'Drinks' }))
        .status
    ).toBe(403);

    const categoryResponse = await request(app)
      .post(`${BASE}/categories`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Drinks' });
    expect(categoryResponse.status).toBe(201);
    const categoryId = categoryResponse.body.category.id as string;
    expect((await request(app).get(`${BASE}/categories`)).body.categories).toHaveLength(1);

    const missingCategory = await request(app)
      .post(`${BASE}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId: '00000000-0000-4000-8000-000000000000', name: 'Tea', price: 2 });
    expect(missingCategory.status).toBe(404);

    const itemResponse = await request(app)
      .post(`${BASE}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, name: 'Tea', price: 2.5, stockCount: 2, lowStockThreshold: 2 });
    expect(itemResponse.status).toBe(201);
    const itemId = itemResponse.body.item.id as string;
    expect((await request(app).get(`${BASE}/items?categoryId=${categoryId}&availableOnly=true`)).body.items).toHaveLength(1);
    expect((await request(app).get(`${BASE}/items/low-stock`).set('Authorization', `Bearer ${adminToken}`)).body.items[0].id).toBe(itemId);

    const updated = await request(app)
      .patch(`${BASE}/items/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isAvailable: false });
    expect(updated.status).toBe(200);
    expect((await request(app).get(`${BASE}/items?availableOnly=true`)).body.items).toHaveLength(0);
    expect((await request(app).get(`${BASE}/items?availableOnly=false`)).body.items).toHaveLength(1);

    expect(
      (await request(app).delete(`${BASE}/items/${itemId}`).set('Authorization', `Bearer ${adminToken}`)).status
    ).toBe(204);
    expect(
      (await request(app).delete(`${BASE}/categories/${categoryId}`).set('Authorization', `Bearer ${adminToken}`)).status
    ).toBe(204);
    expect(await prisma.menuItem.count()).toBe(0);
  });
});
