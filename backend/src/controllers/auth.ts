import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as authService from '../services/auth';
import { validateRegistration } from '../utils/validators';
import { ApiResponse } from '../types';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password, firstName, lastName } = req.body;

  // Validate input
  const validation = validateRegistration({ email, phone, password, firstName, lastName });
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    } as ApiResponse);
    return;
  }

  // Register user
  const result = await authService.register({
    email,
    phone,
    password,
    firstName,
    lastName,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: result.user,
      token: result.token,
    },
  } as ApiResponse);
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    } as ApiResponse);
    return;
  }

  const result = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      token: result.token,
    },
  } as ApiResponse);
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await authService.logout(token);
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  } as ApiResponse);
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const profile = await authService.getProfile(req.user.userId);

  res.status(200).json({
    success: true,
    data: profile,
  } as ApiResponse);
});

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const profile = await authService.updateProfile(req.user.userId, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  } as ApiResponse);
});

// Verify email
export const verifyEmail = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement email verification logic
  res.status(200).json({
    success: true,
    message: 'Email verification endpoint (to be implemented)',
  } as ApiResponse);
});

// Request password reset
export const requestPasswordReset = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement password reset request logic
  res.status(200).json({
    success: true,
    message: 'Password reset request endpoint (to be implemented)',
  } as ApiResponse);
});

// Reset password
export const resetPassword = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement password reset logic
  res.status(200).json({
    success: true,
    message: 'Password reset endpoint (to be implemented)',
  } as ApiResponse);
});

export default {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};
