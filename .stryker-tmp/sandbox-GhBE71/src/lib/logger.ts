// @ts-nocheck
import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : env.logLevel,
  transport:
    env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  redact: ['req.headers.authorization', 'password', 'hashedPassword']
});
