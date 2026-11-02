// @ts-nocheck
import { env } from '../src/config/env.js';
console.log('DEBUG isTest:', env.isTest, 'NODE_ENV:', process.env.NODE_ENV);

import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Debug env', () => {
  it('checks env', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
