// @ts-nocheck
import { randomUUID } from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { createErrorHandler } from '../src/middleware/errorHandler.js';
import { prisma } from '../src/lib/prisma.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { cleanDb, createTestUser } from './helpers.js';

const app = createApp();
const API = '/api/v1';

describe('Security and authorization tests', () => {
  beforeEach(cleanDb);

  it('rejects unauthenticated, expired, malformed, and tampered bearer tokens', async () => {
    const { user } = await createTestUser('customer');
    const valid = signAccessToken(user.id, user.role);
    const expired = jwt.sign(
      { sub: user.id, role: user.role, tokenType: 'access' },
      env.jwtAccessSecret,
      { expiresIn: -1, issuer: 'tableflow', audience: 'tableflow-web' }
    );

    expect((await request(app).get(`${API}/orders`)).status).toBe(401);
    expect((await request(app).get(`${API}/orders`).set('Authorization', 'Bearer malformed')).status).toBe(401);
    expect((await request(app).get(`${API}/orders`).set('Authorization', `Bearer ${valid}tampered`)).status).toBe(401);
    expect((await request(app).get(`${API}/orders`).set('Authorization', `Bearer ${expired}`)).status).toBe(401);
  });

  it('denies customers and waiters every admin-only route while allowing public menu reads', async () => {
    const { user: customer } = await createTestUser('customer');
    const { user: waiter } = await createTestUser('waiter');
    const customerToken = signAccessToken(customer.id, customer.role);
    const waiterToken = signAccessToken(waiter.id, waiter.role);

    const deniedRequests = [
      request(app).post(`${API}/menu/categories`).send({ name: 'No access' }),
      request(app).post(`${API}/menu/categories`).set('Authorization', `Bearer ${customerToken}`).send({ name: 'No access' }),
      request(app).post(`${API}/menu/categories`).set('Authorization', `Bearer ${waiterToken}`).send({ name: 'No access' }),
      request(app).get(`${API}/users`).set('Authorization', `Bearer ${customerToken}`),
      request(app).get(`${API}/analytics/summary`).set('Authorization', `Bearer ${customerToken}`),
      request(app).get(`${API}/feedback`).set('Authorization', `Bearer ${customerToken}`),
      request(app).get(`${API}/menu/items/low-stock`).set('Authorization', `Bearer ${customerToken}`),
      request(app).post(`${API}/tables`).set('Authorization', `Bearer ${customerToken}`).send({ number: 12 })
    ];
    const denied = await Promise.all(deniedRequests);
    expect(denied.map((response) => response.status)).toEqual([401, 403, 403, 403, 403, 403, 403, 403]);
    expect((await request(app).get(`${API}/menu/categories`)).status).toBe(200);
    expect((await request(app).get(`${API}/menu/items`)).status).toBe(200);
  });

  it('prevents customers from reading or modifying another customer order and bill', async () => {
    const { user: owner } = await createTestUser('customer');
    const { user: stranger } = await createTestUser('customer');
    const ownerToken = signAccessToken(owner.id, owner.role);
    const strangerToken = signAccessToken(stranger.id, stranger.role);
    const table = await prisma.table.create({
      data: { number: 430, capacity: 4, qrCode: randomUUID() }
    });
    const category = await prisma.menuCategory.create({ data: { name: `Category ${randomUUID()}` } });
    const item = await prisma.menuItem.create({
      data: { categoryId: category.id, name: 'Tea', price: 2 }
    });
    const order = await prisma.order.create({ data: { tableId: table.id, customerId: owner.id } });
    const bill = await prisma.bill.create({
      data: { orderId: order.id, subtotal: 5, tax: 0, total: 5 }
    });

    expect((await request(app).get(`${API}/orders/${order.id}`).set('Authorization', `Bearer ${strangerToken}`)).status)
      .toBe(403);
    expect(
      (await request(app).post(`${API}/orders/${order.id}/items`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ items: [{ menuItemId: item.id, quantity: 1 }] })).status
    ).toBe(403);
    expect(
      (await request(app).get(`${API}/bills/order/${order.id}`).set('Authorization', `Bearer ${strangerToken}`)).status
    ).toBe(403);
    expect((await request(app).get(`${API}/bills/order/${order.id}`).set('Authorization', `Bearer ${ownerToken}`)).status)
      .toBe(200);
    expect(bill.orderId).toBe(order.id);
  });

  it('stores SQL and XSS payloads as inert text in user-controlled fields', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: customer } = await createTestUser('customer');
    const adminToken = signAccessToken(admin.id, admin.role);
    const customerToken = signAccessToken(customer.id, customer.role);
    const payload = `xss-<script>alert(1)</script>-' OR 1=1 ---${randomUUID()}`;
    const passwordPayload = payload.slice(0, 72);

    const category = await request(app)
      .post(`${API}/menu/categories`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: payload });
    expect(category.status).toBe(201);
    const item = await request(app)
      .post(`${API}/menu/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: category.body.category.id,
        name: payload,
        description: payload,
        tags: [payload.slice(0, 50)],
        price: 2
      });
    expect(item.status).toBe(201);
    const staff = await request(app)
      .post(`${API}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `${randomUUID()}@example.test`, password: passwordPayload, name: payload, role: 'waiter' });
    expect(staff.status).toBe(201);
    expect(
      (await request(app).post(`${API}/auth/login`).send({
        email: staff.body.user.email,
        password: passwordPayload
      })).status
    ).toBe(200);
    expect(
      (await request(app)
        .post(`${API}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `' OR 1=1 --`, password: 'Password123!', name: 'Waiter', role: 'waiter' }))
        .status
    ).toBe(400);

    const table = await prisma.table.create({
      data: { number: 431, capacity: 4, qrCode: randomUUID() }
    });
    const orderResponse = await request(app)
      .post(`${API}/orders`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ tableId: table.id, items: [{ menuItemId: item.body.item.id, quantity: 1, notes: payload }] });
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.order.items[0].notes).toBe(payload);
    const feedback = await request(app)
      .post(`${API}/feedback`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: orderResponse.body.order.id, rating: 5, comment: payload });
    expect(feedback.status).toBe(201);
    expect(feedback.body.feedback.comment).toBe(payload);
  });

  it('rejects injection strings in structured IDs, numeric fields, enums, and query filters', async () => {
    const { user: admin } = await createTestUser('admin');
    const { user: customer } = await createTestUser('customer');
    const adminToken = signAccessToken(admin.id, admin.role);
    const customerToken = signAccessToken(customer.id, customer.role);
    const attack = `' OR 1=1; DROP TABLE users; --`;
    const responses = await Promise.all([
      request(app).post(`${API}/tables`).set('Authorization', `Bearer ${adminToken}`).send({ number: attack }),
      request(app).post(`${API}/menu/categories`).set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Category', sortOrder: attack }),
      request(app).post(`${API}/menu/items`).set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId: attack, name: 'Item', price: 1 }),
      request(app).post(`${API}/orders`).set('Authorization', `Bearer ${customerToken}`)
        .send({ tableId: attack, items: [] }),
      request(app).post(`${API}/assistance`).send({ tableId: randomUUID(), type: attack }),
      request(app).post(`${API}/feedback`).set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: randomUUID(), rating: attack }),
      request(app).get(`${API}/analytics/sales?days=${encodeURIComponent(attack)}`)
        .set('Authorization', `Bearer ${adminToken}`),
      request(app).get(`${API}/analytics/top-items?limit=${encodeURIComponent(attack)}`)
        .set('Authorization', `Bearer ${adminToken}`),
      request(app).get(`${API}/orders/${encodeURIComponent(attack)}`)
        .set('Authorization', `Bearer ${customerToken}`),
      request(app).get(`${API}/bills/order/${encodeURIComponent(attack)}`)
        .set('Authorization', `Bearer ${customerToken}`)
    ]);

    expect(responses.map((response) => response.status)).toEqual(Array(10).fill(400));
  });

  it('rejects oversized payloads and malformed JSON without exposing internals', async () => {
    const oversized = await request(app)
      .post(`${API}/auth/signup`)
      .send({ email: 'large@example.test', password: 'Password123!', name: 'x'.repeat(70000) });
    expect(oversized.status).toBe(413);
    const malformed = await request(app)
      .post(`${API}/auth/signup`)
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(malformed.status).toBe(400);
    for (const response of [oversized, malformed]) {
      const body = JSON.stringify(response.body);
      expect(body).not.toMatch(/stack|DATABASE_URL|C:\\\\|node_modules/i);
    }
  });

  it('allows only the configured CORS origin', async () => {
    const allowed = await request(app)
      .options(`${API}/auth/me`)
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');
    expect(allowed.status).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const denied = await request(app)
      .options(`${API}/auth/me`)
      .set('Origin', 'https://attacker.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('CORS_FORBIDDEN');
  });

  it('does not disclose stack traces, filesystem paths, or exception messages on internal errors', async () => {
    const errorApp = express();
    errorApp.get('/failure', (_req, _res, next) => {
      next(new Error('C:\\private\\secrets\\db-password=do-not-disclose'));
    });
    errorApp.use(createErrorHandler(false));
    const response = await request(errorApp).get('/failure');
    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe('Internal server error');
    expect(JSON.stringify(response.body)).not.toMatch(/private|secrets|password|stack|node_modules/i);
  });
});
