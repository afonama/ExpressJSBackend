// @ts-nocheck
import { Router } from 'express';
import * as assistanceController from '../controllers/assistance.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  assistanceIdParamsSchema,
  createAssistanceSchema,
  listAssistanceQuerySchema
} from '../schemas/assistance.schemas.js';

const router = Router();

/**
 * @openapi
 * /assistance:
 *   post:
 *     summary: Create a table assistance request (public)
 *     tags: [Assistance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableId, type]
 *             properties:
 *               tableId: { type: string, format: uuid }
 *               type: { type: string, enum: [call_waiter, request_bill] }
 *     responses:
 *       201: { description: Assistance request created }
 *       400: { description: Invalid request body }
 *       404: { description: Table not found }
 */
router.post('/', validate(createAssistanceSchema, 'body'), assistanceController.create);

/**
 * @openapi
 * /assistance:
 *   get:
 *     summary: List assistance requests (admin or waiter)
 *     tags: [Assistance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pendingOnly
 *         schema: { type: string, enum: ["true", "false"], default: "true" }
 *     responses:
 *       200: { description: Assistance requests returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin or waiter }
 */
router.get('/', authenticate, requireRole('admin', 'waiter'), validate(listAssistanceQuerySchema, 'query'), assistanceController.list);

/**
 * @openapi
 * /assistance/{id}/resolve:
 *   patch:
 *     summary: Resolve an assistance request (admin or waiter)
 *     tags: [Assistance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Assistance request resolved }
 *       400: { description: Invalid assistance request ID }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin or waiter }
 *       404: { description: Assistance request not found }
 */
router.patch('/:id/resolve', authenticate, requireRole('admin', 'waiter'), validate(assistanceIdParamsSchema, 'params'), assistanceController.resolve);

export default router;
