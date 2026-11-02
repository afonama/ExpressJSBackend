import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, notFound } from '../errors.js';
import type { createStaffUserSchema } from '../schemas/users.schemas.js';
import type { z } from 'zod';

type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;

const BCRYPT_ROUNDS = 10;

function publicUser<T extends { hashedPassword: string }>(user: T): Omit<T, 'hashedPassword'> {
  const { hashedPassword: _hashedPassword, ...safeUser } = user;
  return safeUser;
}

export async function createStaffUser(input: CreateStaffUserInput) {
  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        hashedPassword,
        name: input.name,
        role: input.role
      }
    });
    return publicUser(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw conflict('An account with this email already exists');
    }
    throw err;
  }
}

export async function listStaffUsers() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['admin', 'waiter'] } },
    orderBy: { createdAt: 'asc' }
  });
  return users.map(publicUser);
}

export async function deactivateUser(id: string) {
  return setUserActive(id, false);
}

export async function activateUser(id: string) {
  return setUserActive(id, true);
}

async function setUserActive(id: string, isActive: boolean) {
  try {
    const user = await prisma.user.update({ where: { id }, data: { isActive } });
    return publicUser(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw notFound('User not found');
    }
    throw err;
  }
}
