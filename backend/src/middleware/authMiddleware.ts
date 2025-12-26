import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

/**
 * Extended Request interface to include authenticated user data
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * JWT token payload interface
 */
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Custom error class for authentication errors
 */
class AuthenticationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Verify JWT token and extract user information
 * @param token - JWT token to verify
 * @returns Decoded JWT payload
 */
const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError(401, 'Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError(401, 'Invalid token');
    } else {
      throw new AuthenticationError(401, 'Token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Middleware to authenticate JWT token
 * Verifies the token and attaches user info to the request object
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      logger.warn('Missing or malformed authorization header');
      res.status(401).json({
        success: false,
        error: 'Authorization token is missing',
        message: 'Please provide a valid Bearer token in the Authorization header',
      });
      return;
    }

    const payload = verifyToken(token);
    
    // Attach user information to request object
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    logger.debug(`User authenticated: ${payload.email} with role: ${payload.role}`);
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn(`Authentication failed: ${error.message}`);
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        message: 'Authentication failed',
      });
    } else {
      logger.error('Unexpected error during authentication', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during authentication',
      });
    }
  }
};

/**
 * Middleware to authorize based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorizeByRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.warn('User not authenticated for role-based authorization check');
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          message: 'Authentication required to access this resource',
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `User ${req.user.email} with role ${req.user.role} attempted to access restricted resource`
        );
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      logger.debug(`User ${req.user.email} authorized with role: ${req.user.role}`);
      next();
    } catch (error) {
      logger.error('Unexpected error during authorization check', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during authorization',
      });
    }
  };
};

/**
 * Middleware to check if user has specific permissions
 * @param requiredPermissions - Array of permissions required to access the route
 */
export const authorizeByPermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.warn('User not authenticated for permission-based authorization check');
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          message: 'Authentication required to access this resource',
        });
        return;
      }

      const userPermissions = req.user.permissions || [];
      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        logger.warn(
          `User ${req.user.email} attempted to access resource without required permissions`
        );
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `This resource requires the following permissions: ${requiredPermissions.join(', ')}`,
        });
        return;
      }

      logger.debug(
        `User ${req.user.email} authorized with required permissions: ${requiredPermissions.join(', ')}`
      );
      next();
    } catch (error) {
      logger.error('Unexpected error during permission check', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during permission verification',
      });
    }
  };
};

/**
 * Middleware to optionally authenticate - doesn't fail if token is missing
 * but validates it if provided
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
      logger.debug(`User optionally authenticated: ${payload.email}`);
    } else {
      logger.debug('Request proceeded without authentication (optional auth)');
    }

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn(`Optional authentication failed: ${error.message}`);
      // Don't fail - just skip authentication
      next();
    } else {
      logger.error('Unexpected error during optional authentication', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during authentication',
      });
    }
  }
};

/**
 * Middleware to verify user owns the requested resource
 * Compares req.user.id with the userId parameter
 */
export const authorizeResourceOwner = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.warn('User not authenticated for resource ownership check');
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          message: 'Authentication required to access this resource',
        });
        return;
      }

      const requestedUserId = req.params[userIdParam];

      if (req.user.id !== requestedUserId && req.user.role !== 'admin') {
        logger.warn(
          `User ${req.user.id} attempted to access resource owned by ${requestedUserId}`
        );
        res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this resource',
        });
        return;
      }

      logger.debug(`User ${req.user.email} authorized to access resource`);
      next();
    } catch (error) {
      logger.error('Unexpected error during resource ownership check', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred during resource verification',
      });
    }
  };
};

export default authMiddleware;
