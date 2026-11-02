// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { forbidden } from '../errors.js';
import type { Role } from '../lib/jwt.js';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      next(new Error('requireRole must be used after authenticate'));
      return;
    }
    if (!roles.includes(user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}
