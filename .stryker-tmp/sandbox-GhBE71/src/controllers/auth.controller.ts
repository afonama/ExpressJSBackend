// @ts-nocheck
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';
import { REFRESH_COOKIE, ACCESS_COOKIE } from '../lib/jwt.js';
import { extractRefreshToken } from '../middleware/auth.js';
import { badRequest, unauthorized } from '../errors.js';
import { signupSchema, loginSchema } from '../schemas/auth.schemas.js';

const isProdCookie = env.isProd;

export const signup: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    const tokens = await authService.signupCustomer(result.data);
    setAuthCookies(res, tokens);
    res.status(201).json(tokens);
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    const tokens = await authService.login(result.data);
    setAuthCookies(res, tokens);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const refresh: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractRefreshToken(req);
    if (!token) throw badRequest('Missing refresh token');
    const tokens = await authService.refresh(token);
    setAuthCookies(res, tokens);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout(extractRefreshToken(req) ?? undefined);
    res.clearCookie(REFRESH_COOKIE);
    res.clearCookie(ACCESS_COOKIE);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

export const me: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw unauthorized('Authentication required');
    const user = await authService.getUserById(userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }): void {
  const base: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; maxAge?: number } = {
    httpOnly: true,
    secure: isProdCookie,
    sameSite: 'lax',
    ...(env.isTest ? {} : { maxAge: 7 * 24 * 3600 * 1000 })
  };
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: undefined });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, base);
}
