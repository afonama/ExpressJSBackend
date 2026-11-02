import { Router } from 'express';
import * as billsController from '../controllers/bills.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { billIdParamsSchema, orderIdParamsSchema } from '../schemas/bills.schemas.js';

const router = Router();

/**
 * @openapi
 * /bills/order/{orderId}:
 *   post:
 *     summary: Generate a bill from an order (admin or waiter)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201: { description: Bill generated from the order items }
 *       400: { description: Invalid order ID }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin or waiter }
 *       404: { description: Order not found }
 *       409: { description: A bill already exists for this order }
 */
router.post('/order/:orderId', authenticate, requireRole('admin', 'waiter'), validate(orderIdParamsSchema, 'params'), billsController.create);

/**
 * @openapi
 * /bills/order/{orderId}:
 *   get:
 *     summary: Get the bill for an order
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Bill returned }
 *       400: { description: Invalid order ID }
 *       401: { description: Not authenticated }
 *       403: { description: Customer does not own the order }
 *       404: { description: Bill not found }
 */
router.get('/order/:orderId', authenticate, validate(orderIdParamsSchema, 'params'), billsController.getForOrder);

/**
 * @openapi
 * /bills/{id}/pay:
 *   patch:
 *     summary: Mark a bill paid (admin or waiter)
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Bill paid and order marked paid }
 *       400: { description: Invalid bill ID }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin or waiter }
 *       404: { description: Bill not found }
 */
router.patch('/:id/pay', authenticate, requireRole('admin', 'waiter'), validate(billIdParamsSchema, 'params'), billsController.pay);

export default router;
