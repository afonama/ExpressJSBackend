import { Router } from 'express';
import * as tablesController from '../controllers/tables.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  createTableSchema,
  updateTableSchema,
  tableIdParamsSchema,
  qrCodeParamsSchema
} from '../schemas/tables.schemas.js';

const router = Router();

/**
 * @openapi
 * /tables:
 *   post:
 *     summary: Create a new table (admin only)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [number]
 *             properties:
 *               number:
 *                 type: integer
 *                 minimum: 1
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 4
 *     responses:
 *       201:
 *         description: Table created
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not an admin
 *       409:
 *         description: Table number already exists
 */
router.post('/', authenticate, requireRole('admin'), validate(createTableSchema, 'body'), tablesController.create);

/**
 * @openapi
 * /tables:
 *   get:
 *     summary: List all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tables
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, tablesController.list);

/**
 * @openapi
 * /tables/by-qr/{qrCode}:
 *   get:
 *     summary: Look up a table by its QR code (public — no auth required)
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The matching table
 *       404:
 *         description: Table not found
 */
router.get('/by-qr/:qrCode', validate(qrCodeParamsSchema, 'params'), tablesController.getByQrCode);

/**
 * @openapi
 * /tables/{id}:
 *   patch:
 *     summary: Update a table's capacity or status (admin or waiter)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [free, occupied, reserved, needs_bill]
 *               expectedStatus:
 *                 type: string
 *                 enum: [free, occupied, reserved, needs_bill]
 *     responses:
 *       200:
 *         description: Updated table
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not an admin or waiter
 *       404:
 *         description: Table not found
 *       409:
 *         description: Table status changed; reload before retrying
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'waiter'),
  validate(tableIdParamsSchema, 'params'),
  validate(updateTableSchema, 'body'),
  tablesController.update
);

/**
 * @openapi
 * /tables/{id}:
 *   delete:
 *     summary: Delete a table (admin only)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Table deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Table not found
 */
router.delete('/:id', authenticate, requireRole('admin'), validate(tableIdParamsSchema, 'params'), tablesController.remove);

export default router;