import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  addOrderItemsSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  updateOrderStatusSchema
} from '../schemas/orders.schemas.js';

const router = Router();

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableId, items]
 *             properties:
 *               tableId: { type: string, format: uuid }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [menuItemId, quantity]
 *                   properties:
 *                     menuItemId: { type: string, format: uuid }
 *                     quantity: { type: integer, minimum: 1 }
 *                     notes: { type: string, maxLength: 500, nullable: true }
 *     responses:
 *       201: { description: Order created and inventory decremented }
 *       400: { description: Invalid body, unavailable item, or insufficient stock }
 *       401: { description: Not authenticated }
 *       404: { description: Table or menu item not found }
 */
router.post('/', authenticate, validate(createOrderSchema, 'body'), ordersController.create);

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: List orders visible to the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tableId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string, enum: ["true", "false"] }
 *     responses:
 *       200: { description: Orders returned }
 *       400: { description: Invalid query parameters }
 *       401: { description: Not authenticated }
 */
router.get('/', authenticate, validate(listOrdersQuerySchema, 'query'), ordersController.list);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Get an order (customers may view their own orders)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Order returned }
 *       400: { description: Invalid order ID }
 *       401: { description: Not authenticated }
 *       403: { description: Customer does not own the order }
 *       404: { description: Order not found }
 */
router.get('/:id', authenticate, validate(orderIdParamsSchema, 'params'), ordersController.get);

/**
 * @openapi
 * /orders/{id}/items:
 *   post:
 *     summary: Add items to an open order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [menuItemId, quantity]
 *                   properties:
 *                     menuItemId: { type: string, format: uuid }
 *                     quantity: { type: integer, minimum: 1 }
 *                     notes: { type: string, maxLength: 500, nullable: true }
 *     responses:
 *       200: { description: Order updated }
 *       400: { description: Invalid body, closed order, or insufficient stock }
 *       401: { description: Not authenticated }
 *       403: { description: Customer does not own the order }
 *       404: { description: Order or menu item not found }
 */
router.post('/:id/items', authenticate, validate(orderIdParamsSchema, 'params'), validate(addOrderItemsSchema, 'body'), ordersController.addItems);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     summary: Update an order status (admin or waiter)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, expectedStatus]
 *             properties:
 *               status: { type: string, enum: [placed, preparing, ready, served, paid, cancelled] }
 *               expectedStatus: { type: string, enum: [placed, preparing, ready, served, paid, cancelled] }
 *     responses:
 *       200: { description: Order status updated }
 *       400: { description: Invalid body }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin or waiter }
 *       404: { description: Order not found }
 *       409: { description: Order status changed; reload before retrying }
 */
router.patch('/:id/status', authenticate, requireRole('admin', 'waiter'), validate(orderIdParamsSchema, 'params'), validate(updateOrderStatusSchema, 'body'), ordersController.updateStatus);

export default router;
