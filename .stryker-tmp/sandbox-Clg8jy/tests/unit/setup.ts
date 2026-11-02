// @ts-nocheck
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'unit-test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-at-least-32-characters';
process.env.DATABASE_URL = 'postgresql://unit:unit@127.0.0.1:1/tableflow_unit';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';
process.env.TAX_RATE = '0.075';

export {};
