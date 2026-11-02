import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { isPlainObject } from './type-guards';

export type Role = 'admin' | 'waiter' | 'customer';

export interface TokenPayload {
  sub: string;
  role: Role;
  tokenType: 'access' | 'refresh';
  familyId?: string;
}

const ACCESS_TTL_SECONDS = ttlToSeconds(env.accessTokenTtl);
const REFRESH_TTL_SECONDS = ttlToSeconds(env.refreshTokenTtl);

function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
  const [, valueStr, unit] = match;
  if (!valueStr || !unit) throw new Error(`Invalid TTL format: ${ttl}`);
  const value = parseInt(valueStr, 10);
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: throw new Error(`Invalid TTL unit: ${unit}`);
  }
}

export const ACCESS_COOKIE = 'tf_access';
export const REFRESH_COOKIE = 'tf_refresh';

export { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS };

function isTokenPayload(value: unknown): value is TokenPayload {
  return (
    isPlainObject(value) &&
    typeof value.sub === 'string' &&
    (value.role === 'admin' || value.role === 'waiter' || value.role === 'customer') &&
    (value.tokenType === 'access' || value.tokenType === 'refresh') &&
    (value.familyId === undefined || typeof value.familyId === 'string')
  );
}

export function isRole(value: string): value is Role {
  return value === 'admin' || value === 'waiter' || value === 'customer';
}

export function signAccessToken(userId: string, role: Role, familyId?: string): string {
  return jwt.sign({ sub: userId, role, tokenType: 'access', ...(familyId ? { familyId } : {}) }, env.jwtAccessSecret, {
    expiresIn: ACCESS_TTL_SECONDS,
    issuer: 'tableflow',
    audience: 'tableflow-web'
  });
}

export function signRefreshToken(userId: string, role: Role, familyId?: string): string {
  return jwt.sign({ sub: userId, role, tokenType: 'refresh', ...(familyId ? { familyId } : {}) }, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TTL_SECONDS,
    jwtid: randomUUID(),
    issuer: 'tableflow',
    audience: 'tableflow-web'
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded: unknown = jwt.verify(token, env.jwtAccessSecret, {
    issuer: 'tableflow',
    audience: 'tableflow-web'
  });
  if (typeof decoded === 'string') throw new jwt.JsonWebTokenError('Invalid access token');
  if (!isTokenPayload(decoded)) throw new jwt.JsonWebTokenError('Invalid access token payload');
  if (decoded.tokenType !== 'access') throw new jwt.TokenExpiredError('Wrong token type', new Date(0));
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded: unknown = jwt.verify(token, env.jwtRefreshSecret, {
    issuer: 'tableflow',
    audience: 'tableflow-web'
  });
  if (typeof decoded === 'string') throw new jwt.JsonWebTokenError('Invalid refresh token');
  if (!isTokenPayload(decoded)) throw new jwt.JsonWebTokenError('Invalid refresh token payload');
  if (decoded.tokenType !== 'refresh') throw new jwt.JsonWebTokenError('Wrong token type');
  return decoded;
}
