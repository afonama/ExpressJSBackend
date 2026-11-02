import { env } from '../config/env.js';
import { PrismaClient } from '@prisma/client';

export const prisma: PrismaClient = new PrismaClient({
  log: env.isProd ? ['error', 'warn'] : ['error', 'warn', 'info']
});
