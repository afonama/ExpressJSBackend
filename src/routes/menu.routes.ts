import { Router } from 'express';
import * as menuController from '../controllers/menu.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  categoryIdParamsSchema,
  createCategorySchema,
  createMenuItemSchema,
  listMenuItemsQuerySchema,
  menuItemIdParamsSchema,
  updateMenuItemSchema
} from '../schemas/menu.schemas.js';

const router = Router();

/**
 * @openapi
 * /menu/categories:
 *   post:
 *     summary: Create a menu category (admin only)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               sortOrder: { type: integer, default: 0 }
 *     responses:
 *       201: { description: Category created }
 *       400: { description: Invalid request body }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       409: { description: Category name already exists }
 */
router.post('/categories', authenticate, requireRole('admin'), validate(createCategorySchema, 'body'), menuController.createCategory);

/**
 * @openapi
 * /menu/categories:
 *   get:
 *     summary: List menu categories
 *     tags: [Menu]
 *     responses:
 *       200: { description: Categories returned }
 */
router.get('/categories', menuController.listCategories);

/**
 * @openapi
 * /menu/categories/{id}:
 *   delete:
 *     summary: Delete a menu category (admin only)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Category deleted }
 *       400: { description: Invalid category ID }
 *       409: { description: Category contains menu items used by orders }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       404: { description: Category not found }
 */
router.delete('/categories/:id', authenticate, requireRole('admin'), validate(categoryIdParamsSchema, 'params'), menuController.deleteCategory);

/**
 * @openapi
 * /menu/items:
 *   post:
 *     summary: Create a menu item (admin only)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, price]
 *             properties:
 *               categoryId: { type: string, format: uuid }
 *               name: { type: string, minLength: 1, maxLength: 150 }
 *               description: { type: string, nullable: true }
 *               price: { type: number, exclusiveMinimum: 0 }
 *               imageUrl: { type: string, format: uri, nullable: true }
 *               isAvailable: { type: boolean, default: true }
 *               tags: { type: array, items: { type: string, minLength: 1, maxLength: 50 }, default: [] }
 *               stockCount: { type: integer, minimum: 0, nullable: true }
 *               lowStockThreshold: { type: integer, minimum: 0, default: 5 }
 *     responses:
 *       201: { description: Menu item created }
 *       400: { description: Invalid request body }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       404: { description: Category not found }
 */
router.post('/items', authenticate, requireRole('admin'), validate(createMenuItemSchema, 'body'), menuController.createMenuItem);

/**
 * @openapi
 * /menu/items:
 *   get:
 *     summary: List menu items
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: availableOnly
 *         schema: { type: string, enum: ["true", "false"] }
 *     responses:
 *       200: { description: Menu items returned }
 *       400: { description: Invalid query parameters }
 */
router.get('/items', validate(listMenuItemsQuerySchema, 'query'), menuController.listMenuItems);

/**
 * @openapi
 * /menu/items/low-stock:
 *   get:
 *     summary: List menu items at or below their stock threshold (admin only)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Low-stock items returned }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 */
router.get('/items/low-stock', authenticate, requireRole('admin'), menuController.listLowStockItems);

/**
 * @openapi
 * /menu/items/{id}:
 *   patch:
 *     summary: Update a menu item (admin only)
 *     tags: [Menu]
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
 *             properties:
 *               categoryId: { type: string, format: uuid }
 *               name: { type: string, minLength: 1, maxLength: 150 }
 *               description: { type: string, nullable: true }
 *               price: { type: number, exclusiveMinimum: 0 }
 *               imageUrl: { type: string, format: uri, nullable: true }
 *               isAvailable: { type: boolean }
 *               tags: { type: array, items: { type: string, minLength: 1, maxLength: 50 } }
 *               stockCount: { type: integer, minimum: 0, nullable: true }
 *               lowStockThreshold: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: Menu item updated }
 *       400: { description: Invalid request }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       404: { description: Menu item or category not found }
 */
router.patch('/items/:id', authenticate, requireRole('admin'), validate(menuItemIdParamsSchema, 'params'), validate(updateMenuItemSchema, 'body'), menuController.updateMenuItem);

/**
 * @openapi
 * /menu/items/{id}:
 *   delete:
 *     summary: Delete a menu item (admin only)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Menu item deleted }
 *       400: { description: Invalid menu item ID }
 *       409: { description: Menu item is used by an order }
 *       401: { description: Not authenticated }
 *       403: { description: Not an admin }
 *       404: { description: Menu item not found }
 */
router.delete('/items/:id', authenticate, requireRole('admin'), validate(menuItemIdParamsSchema, 'params'), menuController.deleteMenuItem);

export default router;
