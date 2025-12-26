import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
} from '../validators/authValidators';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 */
router.post(
  '/login',
  validateRequest(loginSchema),
  AuthController.login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Initiate password reset by sending verification code
 * @access  Public
 */
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verify the password reset code
 * @access  Public
 */
router.post(
  '/verify-code',
  validateRequest(verifyCodeSchema),
  AuthController.verifyCode
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with verified code
 * @access  Public
 */
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  AuthController.refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get(
  '/profile',
  authMiddleware,
  AuthController.getUserProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware,
  AuthController.logout
);

export default router;
