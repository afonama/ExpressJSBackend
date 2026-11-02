// @ts-nocheck
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';
import { AppError } from '../errors.js';
import { isPlainObject } from '../lib/type-guards.js';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function hasStringType(err: unknown): err is { type: string } {
  return isPlainObject(err) && typeof err.type === 'string';
}

function errorBody(code: string, message: string, details?: unknown): ApiErrorBody {
  const body: ApiErrorBody = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return body;
}

export function createErrorHandler(_isProd: boolean) {
  return (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof AppError) {
      res.status(err.status).json(errorBody(err.code, err.message, err.details));
      return;
    }

    if (err instanceof ZodError) {
      res.status(400).json(errorBody('VALIDATION_ERROR', 'Request validation failed', err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))));
      return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        res.status(409).json(errorBody('CONFLICT', 'A record with the same unique field already exists'));
        return;
      }
      if (err.code === 'P2025') {
        res.status(404).json(errorBody('NOT_FOUND', 'Record not found'));
        return;
      }
      if (err.code === 'P2003') {
        res.status(400).json(errorBody('FK_CONSTRAINT', 'Referenced record does not exist'));
        return;
      }
    }

    if (hasStringType(err) && err.type === 'entity.too.large') {
      res.status(413).json(errorBody('PAYLOAD_TOO_LARGE', 'Request body exceeds allowed size'));
      return;
    }

    if (
      hasStringType(err) &&
      ['entity.parse.failed', 'entity.invalid'].includes(err.type)
    ) {
      res.status(400).json(errorBody('BAD_JSON', 'Request body must be valid JSON'));
      return;
    }

    logger.error({ err, path: req.originalUrl }, 'Unhandled error');

    res.status(500).json(errorBody('INTERNAL_ERROR', 'Internal server error'));
  };
}
