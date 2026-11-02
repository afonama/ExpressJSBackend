// @ts-nocheck
import jwt from 'jsonwebtoken';
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  isRole,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from '../../src/lib/jwt.js';

const userId = '00000000-0000-4000-8000-000000000001';

describe('JWT unit tests', () => {
  it('converts configured token lifetimes to seconds', () => {
    expect(ACCESS_TTL_SECONDS).toBe(900);
    expect(REFRESH_TTL_SECONDS).toBe(604800);
  });

  it.each(['admin', 'waiter', 'customer'] as const)('signs and verifies access and refresh tokens for %s', (role) => {
    expect(verifyAccessToken(signAccessToken(userId, role))).toMatchObject({
      sub: userId,
      role,
      tokenType: 'access'
    });
    expect(verifyRefreshToken(signRefreshToken(userId, role))).toMatchObject({
      sub: userId,
      role,
      tokenType: 'refresh'
    });
  });

  it('rejects malformed, tampered, and cross-purpose tokens', () => {
    const access = signAccessToken(userId, 'customer');
    expect(() => verifyAccessToken('not-a-jwt')).toThrow(jwt.JsonWebTokenError);
    expect(() => verifyAccessToken(`${access}tampered`)).toThrow(jwt.JsonWebTokenError);
    expect(() => verifyRefreshToken(access)).toThrow(jwt.JsonWebTokenError);
    expect(() => verifyAccessToken(signRefreshToken(userId, 'customer'))).toThrow(jwt.JsonWebTokenError);
  });

  it('recognizes only known roles', () => {
    expect(isRole('admin')).toBe(true);
    expect(isRole('customer')).toBe(true);
    expect(isRole('guest')).toBe(false);
  });
});
