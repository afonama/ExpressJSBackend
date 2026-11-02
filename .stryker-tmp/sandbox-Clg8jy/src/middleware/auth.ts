// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, REFRESH_COOKIE, ACCESS_COOKIE } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { unauthorized } from '../errors.js';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookie = req.cookies?.[ACCESS_COOKIE];
  if (cookie) return cookie;
  return null;
}

export function extractRefreshToken(req: Request): string | null {
  if (typeof req.body?.refreshToken === 'string' && req.body.refreshToken.length > 0) {
    return req.body.refreshToken;
  }
  const cookie = req.cookies?.[REFRESH_COOKIE];
  if (cookie) return cookie;
  if (req.headers.authorization?.startsWith('Refresh ')) {
    return req.headers.authorization.slice(8);
  }
  return null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw unauthorized('Missing access token');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        throw unauthorized('Access token expired');
      }
      throw unauthorized('Invalid access token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw unauthorized('Account not found or deactivated');
    if (payload.familyId) {
      const activeSession = await prisma.refreshToken.findFirst({
        where: {
          familyId: payload.familyId,
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        }
      });
      if (!activeSession) throw unauthorized('Session has been revoked or expired');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (err) {
    next(err);
  }
}
