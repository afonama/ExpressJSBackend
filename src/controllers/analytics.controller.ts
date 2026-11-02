import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as analyticsService from '../services/analytics.service.js';

export const summary: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.getSummary();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const sales: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.getSales((req.query as { days?: number }).days);
    res.json({ sales: result });
  } catch (err) {
    next(err);
  }
};

export const topItems: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.getTopItems((req.query as { limit?: number }).limit);
    res.json({ items: result });
  } catch (err) {
    next(err);
  }
};

export const peakHours: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.getPeakHours();
    res.json({ peakHours: result });
  } catch (err) {
    next(err);
  }
};
