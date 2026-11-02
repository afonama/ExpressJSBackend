import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createStaffUserSchema, userIdParamsSchema } from '../schemas/users.schemas.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create an admin or waiter account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email: { type: string, format: email, maxLength: 254 }
 *               password: { type: string, minLength: 8, maxLength: 72 }
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               role: { type: string, enum: [admin, waiter] }
 *     responses:
 *       201: { description: Staff account created }
 *       400: { description: Invalid body or customer role (use /auth/signup) }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       409: { description: Email already registered }
 */
router.post('/', validate(createStaffUserSchema, 'body'), usersController.create);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List admin and waiter accounts
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Staff accounts returned }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/', usersController.list);

/**
 * @openapi
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a staff account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Account deactivated }
 *       400: { description: Invalid user ID }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       404: { description: User not found }
 */
router.patch('/:id/deactivate', validate(userIdParamsSchema, 'params'), usersController.deactivate);

/**
 * @openapi
 * /users/{id}/activate:
 *   patch:
 *     summary: Activate a staff account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Account activated }
 *       400: { description: Invalid user ID }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       404: { description: User not found }
 */
router.patch('/:id/activate', validate(userIdParamsSchema, 'params'), usersController.activate);

export default router;
