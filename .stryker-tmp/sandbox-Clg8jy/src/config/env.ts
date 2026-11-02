// @ts-nocheck
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

const root = path.resolve(__dirname, '../..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  const parsed = dotenv.config({ path: envPath }).parsed ?? {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === 'string' && process.env[k] === undefined) process.env[k] = v;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string'
    }),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  TAX_RATE: z.coerce.number().min(0).max(1).default(0.075),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(
    `Invalid environment configuration:\n${issues}\n` +
      'Copy .env.example to .env and fill in real values before starting the server.'
  );
  process.exit(1);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  accessTokenTtl: parsed.data.ACCESS_TOKEN_TTL,
  refreshTokenTtl: parsed.data.REFRESH_TOKEN_TTL,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  taxRate: parsed.data.TAX_RATE,
  logLevel: parsed.data.LOG_LEVEL
};
