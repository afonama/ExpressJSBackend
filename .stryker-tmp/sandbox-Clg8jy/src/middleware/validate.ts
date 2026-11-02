// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type Schema = z.ZodTypeAny;
type Source = 'body' | 'query' | 'params';

/**
 * Parse req.[source] with a Zod schema. On failure the ZodError flows to the
 * centralized error handler (SENT: 400 VALIDATION_ERROR with issue details).
 */
export function validate(schema: Schema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === 'query') {
      // req.query is a getter on Express 5; override on the instance.
      Object.defineProperty(req, 'query', { value: result.data, configurable: true });
    } else {
      req[source] = result.data;
    }
    next();
  };
}

export const zUUID = z.string().uuid();
