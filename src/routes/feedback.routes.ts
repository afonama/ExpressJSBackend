import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createFeedbackSchema } from '../schemas/feedback.schemas.js';

const router = Router();

/**
 * @openapi
 * /feedback:
 *   post:
 *     summary: Submit feedback for an order
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, rating]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string, maxLength: 2000, nullable: true }
 *     responses:
 *       201: { description: Feedback submitted }
 *       400: { description: Rating or request body is invalid }
 *       401: { description: Not authenticated }
 *       403: { description: Customer does not own the order }
 *       404: { description: Order not found }
 *       409: { description: Feedback already exists for this order }
 */
router.post('/', authenticate, validate(createFeedbackSchema, 'body'), feedbackController.create);

/**
 * @openapi
 * /feedback:
 *   get:
 *     summary: List all feedback (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Feedback returned }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/', authenticate, requireRole('admin'), feedbackController.list);

export default router;
