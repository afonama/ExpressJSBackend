// @ts-nocheck
import type { PrismaClient } from '@prisma/client';

function delegate() {
  return {
    aggregate: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    groupBy: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  };
}

export const mockPrisma = {
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  assistanceRequest: delegate(),
  bill: delegate(),
  feedback: delegate(),
  menuCategory: delegate(),
  menuItem: delegate(),
  order: delegate(),
  orderItem: delegate(),
  refreshToken: delegate(),
  table: delegate(),
  user: delegate()
};

export const prisma = mockPrisma as unknown as PrismaClient;

export function resetPrismaMock(): void {
  jest.resetAllMocks();
}
