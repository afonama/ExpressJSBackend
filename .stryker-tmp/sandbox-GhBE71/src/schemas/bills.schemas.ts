// @ts-nocheck
import { z } from 'zod';
import { zUUID } from '../middleware/validate.js';

export const orderIdParamsSchema = z.object({ orderId: zUUID });
export const billIdParamsSchema = z.object({ id: zUUID });
