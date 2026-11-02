// @ts-nocheck
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { OrderStatus } from '@prisma/client';
import * as ordersService from '../services/orders.service.js';

export const create: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.createOrder(req.body, req.user!);
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await ordersService.listOrders(
      req.query as { tableId?: string; activeOnly?: boolean },
      req.user!
    );
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

export const get: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.getOrder(req.params.id as string, req.user!);
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

export const addItems: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.addOrderItems(req.params.id as string, req.body.items, req.user!);
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

export const updateStatus: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.updateOrderStatus(
      req.params.id as string,
      req.body.status as OrderStatus,
      req.body.expectedStatus as OrderStatus
    );
    res.json({ order });
  } catch (err) {
    next(err);
  }
};
