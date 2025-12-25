import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { AuthPayload } from '../types';
import { query } from '../config/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Verify JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: AuthPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }

    // Check if token is revoked
    const result = await query(
      'SELECT * FROM session_tokens WHERE token = $1 AND is_revoked = false',
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Token has been revoked', 401);
    }

    // Check if token is expired
    const tokenData = result.rows[0];
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new AppError('Token expired', 401);
    }

    // Check if user exists and is active
    const userResult = await query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Check user role
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Not authenticated', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Not authorized to access this resource', 403));
      return;
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

      const userResult = await query(
        'SELECT id, email, role, status FROM users WHERE id = $1 AND status = $2',
        [decoded.userId, 'active']
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };
      }
    } catch (error) {
      // Invalid token, but we don't fail - just continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting middleware
export const rateLimiter = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const requestData = requests.get(identifier);

    if (!requestData || now > requestData.resetTime) {
      // New window
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (requestData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
      });
      return;
    }

    requestData.count++;
    next();
  };
};

// Verify email is verified
export const requireEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const result = await query(
      'SELECT email_verified FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].email_verified) {
      throw new AppError('Email verification required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verify KYC is approved
export const requireKYCApproved = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const result = await query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || result.rows[0].kyc_status !== 'approved') {
      throw new AppError('KYC verification required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  rateLimiter,
  requireEmailVerified,
  requireKYCApproved,
};
