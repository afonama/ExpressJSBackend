// @ts-nocheck
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as menuService from '../services/menu.service.js';

export const createCategory: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await menuService.createCategory(req.body);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

export const listCategories: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await menuService.listCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await menuService.deleteCategory(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const createMenuItem: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await menuService.createMenuItem(req.body);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

export const listMenuItems: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await menuService.listMenuItems(req.query as { categoryId?: string; availableOnly?: boolean });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const listLowStockItems: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await menuService.listLowStockItems();
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const updateMenuItem: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await menuService.updateMenuItem(req.params.id as string, req.body);
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItem: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await menuService.deleteMenuItem(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
