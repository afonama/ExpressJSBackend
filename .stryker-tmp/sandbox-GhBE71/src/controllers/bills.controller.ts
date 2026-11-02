// @ts-nocheck
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as billsService from '../services/bills.service.js';

export const create: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await billsService.createBill(req.params.orderId as string);
    res.status(201).json({ bill });
  } catch (err) {
    next(err);
  }
};

export const getForOrder: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await billsService.getBillForOrder(req.params.orderId as string, req.user!);
    res.json({ bill });
  } catch (err) {
    next(err);
  }
};

export const pay: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await billsService.payBill(req.params.id as string);
    res.json({ bill });
  } catch (err) {
    next(err);
  }
};
