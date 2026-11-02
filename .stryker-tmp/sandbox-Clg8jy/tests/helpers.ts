// @ts-nocheck
import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';

beforeAll(async () => {
  // Verify DB connectivity early with a clearer error message.
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

export async function cleanDb(): Promise<void> {
  await prisma.$transaction([
    prisma.feedback.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.assistanceRequest.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.menuCategory.deleteMany(),
    prisma.table.deleteMany(),
    prisma.user.deleteMany()
  ]);
}

export async function createTestUser(role: 'admin' | 'waiter' | 'customer', overrides: Partial<{ email: string; password: string; name: string }> = {}) {
  const email = overrides.email ?? `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`;
  const password = overrides.password ?? 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 4);
  const user = await prisma.user.create({
    data: { email, hashedPassword, name: overrides.name ?? `${role} user`, role }
  });
  return { user, email, password };
}
