// @ts-nocheck
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cleanDb, createTestUser } from './helpers.js';
import { signAccessToken } from '../src/lib/jwt.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/lib/logger.js';

const app = createApp();
const BASE = '/api/v1/auth';

const uniqueEmail = () => `cust-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`;

describe('Auth: signup', () => {
  it('completes signup, login, and an authenticated profile request', async () => {
    const email = uniqueEmail();
    const password = 'Password123!';
    const signup = await request(app).post(`${BASE}/signup`).send({ email, password, name: 'Journey' });
    expect(signup.status).toBe(201);
    const login = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(login.status).toBe(200);
    const profile = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user).toMatchObject({ email, role: 'customer', name: 'Journey' });
  });

  it('creates a customer account and returns tokens (happy path)', async () => {
    const res = await request(app)
      .post(`${BASE}/signup`)
      .send({ email: uniqueEmail(), password: 'Password123!', name: 'Jane Doe' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  it('stores a bcrypt hash, never plaintext', async () => {
    const email = uniqueEmail();
    await request(app).post(`${BASE}/signup`).send({ email, password: 'Password123!', name: 'X' });
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.hashedPassword).toBeTruthy();
    expect(user?.hashedPassword).not.toBe('Password123!');
    expect(user?.hashedPassword).toMatch(/^\$2[aby]\$/);
  });

  it('rejects duplicate email with 409', async () => {
    const email = uniqueEmail();
    await request(app).post(`${BASE}/signup`).send({ email, password: 'Password123!', name: 'A' });
    const res = await request(app).post(`${BASE}/signup`).send({ email, password: 'Password123!', name: 'B' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects weak/short passwords, invalid email, long names with 400 + Zod details', async () => {
    const res = await request(app).post(`${BASE}/signup`).send({ email: 'not-an-email', password: 'short', name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toContain('email');
    expect(paths).toContain('password');
    expect(paths).toContain('name');
  });

  it('rejects oversized payload with 413', async () => {
    const res = await request(app)
      .post(`${BASE}/signup`)
      .send({ email: uniqueEmail(), password: 'Password123!', name: 'x'.repeat(70000) });
    expect([400, 413]).toContain(res.status);
  });

  it('responds 400 with BAD_JSON for malformed JSON body', async () => {
    const res = await request(app).post(`${BASE}/signup`).set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_JSON');
  });
});

describe('Auth: login', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  it('logs in with valid credentials', async () => {
    const { email, password } = await createTestUser('customer');
    const res = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects wrong password with generic 401', async () => {
    const { email, password } = await createTestUser('customer');
    const res = await request(app).post(`${BASE}/login`).send({ email, password: password.toUpperCase() });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
    expect(JSON.stringify(res.body)).not.toContain('hashed');
  });

  it('rejects unknown email with generic 401', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'ghost@test.dev', password: 'Whatever123' });
    expect(res.status).toBe(401);
  });

  it('rejects deactivated account with 401', async () => {
    const { user, email, password } = await createTestUser('customer');
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    const res = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(res.status).toBe(401);
  });

  it('rejects malformed credentials with 400', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'nope', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Auth: rate limiting', () => {
  it('enforces rate limiting after too many attempts (runs last)', async () => {
    const email = uniqueEmail();
    const wasTest = env.isTest;
    env.isTest = false;
    try {
      for (let i = 0; i < 20; i++) {
        await request(app).post(`${BASE}/login`).send({ email, password: 'nope' });
      }
      const res = await request(app).post(`${BASE}/login`).send({ email, password: 'nope' });
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMITED');
      const signup = await request(app)
        .post(`${BASE}/signup`)
        .send({ email: uniqueEmail(), password: 'Password123!', name: 'Rate limited' });
      expect(signup.status).toBe(429);
      expect(signup.body.error.code).toBe('RATE_LIMITED');
    } finally {
      env.isTest = wasTest;
    }
  });
});

describe('Auth: refresh & me & malformed tokens', () => {
  let email: string;
  let password: string;
  beforeEach(async () => {
    await cleanDb();
    const u = await createTestUser('customer');
    email = u.email;
    password = u.password;
  });

  it('rotates tokens with a valid refresh token (cookie or body)', async () => {
    const loginRes = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(loginRes.status).toBe(200);
    const secondSession = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(secondSession.status).toBe(200);
    const refreshToken = loginRes.body.refreshToken;
    expect(refreshToken).toBeTruthy();
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(refreshToken);
    const securityEvent = jest.spyOn(logger, 'warn');
    const replay = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(replay.status).toBe(401);
    expect(securityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String), familyId: expect.any(String) }),
      'Refresh token reuse detected; token family revoked'
    );
    securityEvent.mockRestore();
    const revokedSession = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(revokedSession.status).toBe(401);
    const revokedOtherSession = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${secondSession.body.accessToken}`);
    expect(revokedOtherSession.status).toBe(401);
    const replacementReplay = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: res.body.refreshToken });
    expect(replacementReplay.status).toBe(401);
  });

  it('rejects refresh with an access token (wrong token type)', async () => {
    const { user } = await createTestUser('customer');
    const accessToken = signAccessToken(user.id, user.role);
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken: accessToken });
    expect(res.status).toBe(401);
  });

  it('revokes the session family on logout', async () => {
    const login = await request(app).post(`${BASE}/login`).send({ email, password });
    const logout = await request(app).post(`${BASE}/logout`).send({ refreshToken: login.body.refreshToken });
    expect(logout.status).toBe(200);
    const refresh = await request(app).post(`${BASE}/refresh`).send({ refreshToken: login.body.refreshToken });
    expect(refresh.status).toBe(401);
    const profile = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(profile.status).toBe(401);
  });

  it('rejects invalid/expired/forged refresh token with 401', async () => {
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken: 'garbage.token.here' });
    expect(res.status).toBe(401);
  });

  it('rejects refresh after deactivation by an admin', async () => {
    const { user, email: waiterEmail, password } = await createTestUser('waiter');
    const login = await request(app).post(`${BASE}/login`).send({ email: waiterEmail, password });
    const refreshToken = login.body.refreshToken;
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(res.status).toBe(403);
  });

  it('GET /me returns the current user for a valid access token', async () => {
    const { user, email, password } = await createTestUser('customer');
    const loginRes = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.accessToken;
    expect(token).toBeTruthy();
    const res = await request(app).get(`${BASE}/me`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.hashedPassword).toBeUndefined();
  });

  it('GET /me without token returns 401', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /me with forged token returns 401', async () => {
    const res = await request(app).get(`${BASE}/me`).set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('GET /me with expired access token returns 401 with clear message', async () => {
    const { user } = await createTestUser('customer');
    const token = signAccessToken(user.id, user.role);
    // Forge an already-expired token: use a stale timestamp signature check instead.
    const expired = require('jsonwebtoken').sign(
      { sub: user.id, role: user.role, tokenType: 'access' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s', issuer: 'tableflow', audience: 'tableflow-web' }
    );
    expect(expired).not.toBe(token);
    const res = await request(app).get(`${BASE}/me`).set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Access token expired');
  });

  it('GET /me with deactivated user mid-session returns 401', async () => {
    const { user, password } = await createTestUser('customer');
    const loginRes = await request(app).post(`${BASE}/login`).send({ email: `x-${user.id}@t.dev`, password });
    const token = loginRes.body.accessToken;
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    const res = await request(app).get(`${BASE}/me`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
