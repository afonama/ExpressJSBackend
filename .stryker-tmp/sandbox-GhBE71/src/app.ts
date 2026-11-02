// @ts-nocheck
import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { createErrorHandler } from './middleware/errorHandler.js';
import { logger } from './lib/logger.js';
import { AppError } from './errors.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';
import tablesRoutes from './routes/table.routes.js';
import menuRoutes from './routes/menu.routes.js';
import usersRoutes from './routes/users.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import billsRoutes from './routes/bills.routes.js';
import assistanceRoutes from './routes/assistance.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        callback(new AppError(403, 'CORS_FORBIDDEN', 'Origin not allowed by CORS'));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.use(cookieParser());

  // Lightweight structured request logging, after body parsing.
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      if (req.path !== '/health') {
        logger.info({
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Date.now() - startedAt
        });
      }
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.nodeEnv });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/tables', tablesRoutes);
  app.use('/api/v1/menu', menuRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/orders', ordersRoutes);
  app.use('/api/v1/bills', billsRoutes);
  app.use('/api/v1/assistance', assistanceRoutes);
  app.use('/api/v1/feedback', feedbackRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 404 handler for unmatched routes
  app.use((_req, _res, next) => {
    next(new AppError(404, 'NOT_FOUND', 'Route not found'));
  });

  app.use(createErrorHandler(env.isProd));

  return app;
}