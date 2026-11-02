// @ts-nocheck
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
    const qrCode = req.params.qrCode;
    // Validate that qrCode exists and is a string
    if (!qrCode || typeof qrCode !== 'string') {
      res.status(400).json({ error: 'Invalid or missing QR code' });
      return;
    }
    
    const table = await tablesService.getTableByQrCode(qrCode);
    res.json({ table });
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    // Validate that id exists and is a string
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid or missing table ID' });
      return;
    }

    const table = await tablesService.updateTable(id, req.body);
    res.json({ table });
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    // Validate that id exists and is a string
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid or missing table ID' });
      return;
    }

    await tablesService.deleteTable(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};