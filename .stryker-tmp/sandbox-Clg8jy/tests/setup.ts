// @ts-nocheck
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-min-32-chars-abcdef';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-chars-abcd';
if (process.env.DATABASE_URL) {
  const configuredTestDatabase = new URL(process.env.DATABASE_URL);
  const databaseName = decodeURIComponent(configuredTestDatabase.pathname.slice(1));
  const isLoopback =
    configuredTestDatabase.hostname === 'localhost' ||
    configuredTestDatabase.hostname === '127.0.0.1' ||
    configuredTestDatabase.hostname === '[::1]';
  if (!isLoopback || !/(^|[_-])test($|[_-])/i.test(databaseName)) {
    throw new Error('Integration tests require a loopback PostgreSQL database with "test" in its name');
  }
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/tableflow_test';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

export {};
