// @ts-nocheck
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-abcdef';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-abcd';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tableflow_test';
process.env.CORS_ORIGIN = 'http://localhost:3000';
const { env } = require('./dist/src/config/env.js');
console.log('isTest:', env.isTest);
