import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as assistanceService from '../services/assistance.service.js';

export const create: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assistanceRequest = await assistanceService.createAssistanceRequest(req.body);
    res.status(201).json({ assistanceRequest });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await assistanceService.listAssistanceRequests(
      (req.query as { pendingOnly?: boolean }).pendingOnly
    );
    res.json({ assistanceRequests: result });
  } catch (err) {
    next(err);
  }
};

export const resolve: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assistanceRequest = await assistanceService.resolveAssistanceRequest(req.params.id as string);
    res.json({ assistanceRequest });
  } catch (err) {
    next(err);
  }
};
