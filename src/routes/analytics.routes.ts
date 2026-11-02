import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { salesQuerySchema, topItemsQuerySchema } from '../schemas/analytics.schemas.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

/**
 * @openapi
 * /analytics/summary:
 *   get:
 *     summary: Get revenue, order count, and average order value
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Summary metrics returned }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/summary', analyticsController.summary);

/**
 * @openapi
 * /analytics/sales:
 *   get:
 *     summary: Get paid sales totals grouped by day
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, minimum: 1, maximum: 365, default: 7 }
 *     responses:
 *       200: { description: Daily sales returned }
 *       400: { description: Invalid days value }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/sales', validate(salesQuerySchema, 'query'), analyticsController.sales);

/**
 * @openapi
 * /analytics/top-items:
 *   get:
 *     summary: Rank menu items by quantity sold
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       200: { description: Top-selling items returned }
 *       400: { description: Invalid limit value }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/top-items', validate(topItemsQuerySchema, 'query'), analyticsController.topItems);

/**
 * @openapi
 * /analytics/peak-hours:
 *   get:
 *     summary: Get order counts grouped by hour of day
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Hourly order counts returned }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/peak-hours', analyticsController.peakHours);

export default router;
