// @ts-nocheck
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as feedbackService from '../services/feedback.service.js';

export const create: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedback = await feedbackService.createFeedback(req.body, req.user!);
    res.status(201).json({ feedback });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const feedback = await feedbackService.listFeedback();
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
};
