import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { Role, REFRESH_TTL_SECONDS, isRole, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { SignupInput, LoginInput } from '../schemas/auth.schemas.js';
import { conflict, forbidden, unauthorized } from '../errors.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: Role };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokens(
  user: { id: string; email: string; name: string; role: string },
  familyId = randomUUID()
): Promise<TokenPair> {
  if (!isRole(user.role)) throw new Error(`Invalid role: ${user.role}`);
  const refreshToken = signRefreshToken(user.id, user.role, familyId);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      familyId,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)
    }
  });
  return {
    accessToken: signAccessToken(user.id, user.role, familyId),
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  };
}

export async function signupCustomer(input: SignupInput): Promise<TokenPair> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('An account with this email already exists');

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      hashedPassword,
      name: input.name,
      role: 'customer'
    }
  });

  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<TokenPair> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) {
    throw unauthorized('Invalid email or password');
  }
  const match = await bcrypt.compare(input.password, user.hashedPassword);
  if (!match) {
    throw unauthorized('Invalid email or password');
  }
  return issueTokens(user);
}

export async function refresh(token: string): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw unauthorized('Invalid or expired refresh token');
  }
  if (!payload.familyId) throw unauthorized('Invalid or expired refresh token');

  const tokenHash = hashToken(token);
  const outcome = await prisma.$transaction(async (tx) => {
    const records = await tx.$queryRaw<Array<{
      tokenHash: string;
      familyId: string;
      userId: string;
      expiresAt: Date;
      usedAt: Date | null;
      revokedAt: Date | null;
    }>>`
      SELECT token_hash AS "tokenHash", family_id AS "familyId", user_id AS "userId",
             expires_at AS "expiresAt", used_at AS "usedAt", revoked_at AS "revokedAt"
      FROM refresh_tokens
      WHERE token_hash = ${tokenHash}
      FOR UPDATE
    `;
    const storedToken = records[0];
    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.familyId !== payload.familyId
    ) {
      return { type: 'invalid' as const };
    }

    if (storedToken.usedAt || storedToken.revokedAt) {
      await tx.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      return { type: 'replay' as const, userId: storedToken.userId, familyId: storedToken.familyId };
    }

    if (storedToken.expiresAt <= new Date()) return { type: 'invalid' as const };

    const user = await tx.user.findUnique({ where: { id: storedToken.userId } });
    if (!user || !user.isActive) return { type: 'inactive' as const };

    const replacement = signRefreshToken(user.id, user.role, storedToken.familyId);
    const replacementHash = hashToken(replacement);
    const now = new Date();
    await tx.refreshToken.create({
      data: {
        tokenHash: replacementHash,
        familyId: storedToken.familyId,
        userId: user.id,
        expiresAt: new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000)
      }
    });
    await tx.refreshToken.update({
      where: { tokenHash },
      data: { usedAt: now, replacedByHash: replacementHash }
    });

    return {
      type: 'success' as const,
      tokens: {
        accessToken: signAccessToken(user.id, user.role, storedToken.familyId),
        refreshToken: replacement,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }
    };
  });

  if (outcome.type === 'replay') {
    logger.warn({ userId: outcome.userId, familyId: outcome.familyId }, 'Refresh token reuse detected; token family revoked');
    throw unauthorized('Refresh token reuse detected; session revoked');
  }
  if (outcome.type === 'inactive') throw forbidden('Account is deactivated');
  if (outcome.type === 'invalid') throw unauthorized('Invalid or expired refresh token');
  return outcome.tokens;
}

export async function logout(token?: string): Promise<void> {
  if (!token) return;
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return;
  }
  if (payload.familyId) {
    await prisma.refreshToken.updateMany({
      where: { familyId: payload.familyId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isActive) throw unauthorized('Account not found');
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}
