import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as tablesService from '../services/tables.service.js';

export const create: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tablesService.createTable(req.body);
    res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tablesService.listTables();
    res.json({ tables });
  } catch (err) {
    next(err);
  }
};

export const getByQrCode: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrCode } = req.params as { qrCode: string };
    const table = await tablesService.getTableByQrCode(qrCode);
    res.json({ table });
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const table = await tablesService.updateTable(id, req.body);
    res.json({ table });
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await tablesService.deleteTable(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};