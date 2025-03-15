// filepath: c:\Code\dev\FindFriends\src\routes\authRoutes.ts
import express from 'express';
import { AuthController } from '../controllers/authController';

/**
 * Router for authentication-related API endpoints
 */
export const authRouter = express.Router();

/**
 * POST /api/auth/register
 * Endpoint for user registration
 */
authRouter.post('/register', AuthController.register);

/**
 * POST /api/auth/login
 * Endpoint for user login
 */
authRouter.post('/login', AuthController.login);

/**
 * POST /api/auth/logout
 * Endpoint for user logout
 */
authRouter.post('/logout', AuthController.logout);

/**
 * GET /api/auth/profile
 * Endpoint for getting the current user's profile
 */
authRouter.get('/profile', AuthController.getProfile);

/**
 * PUT /api/auth/profile
 * Endpoint for updating the current user's profile
 */
authRouter.put('/profile', AuthController.updateProfile);