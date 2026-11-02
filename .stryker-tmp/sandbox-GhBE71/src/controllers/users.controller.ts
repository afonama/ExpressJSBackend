// @ts-nocheck
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as usersService from '../services/users.service.js';

export const create: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.createStaffUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await usersService.listStaffUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const deactivate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.deactivateUser(req.params.id as string);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const activate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.activateUser(req.params.id as string);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
