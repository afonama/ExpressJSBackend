// @ts-nocheck
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../schemas/auth.schemas.js';
import { env } from '../config/env.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => env.isTest,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } }
});

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Create a new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created, returns access/refresh tokens and user
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 *       429:
 *         description: Too many signup attempts
 */
router.post('/signup', authLimiter, validate(signupSchema, 'body'), authController.signup);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns access/refresh tokens and user
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account is deactivated
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', authLimiter, validate(loginSchema, 'body'), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new access token
 *     tags: [Auth]
 *     description: Reads the refresh token from an httpOnly cookie set at login/signup.
 *     responses:
 *       200:
 *         description: New access/refresh tokens issued
 *       401:
 *         description: Missing, invalid, or expired refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out and clear the refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user's profile
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, authController.me);

export default router;