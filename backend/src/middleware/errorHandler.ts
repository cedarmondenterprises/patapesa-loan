import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom Error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  status: 'error' | 'fail';
  statusCode: number;
  message: string;
  [key: string]: any;
}

/**
 * Global error handling middleware
 * Catches and formats all application errors
 */
const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let errorResponse: ErrorResponse;

  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    errorResponse = {
      status: err.statusCode >= 500 ? 'error' : 'fail',
      statusCode: err.statusCode,
      message: err.message,
    };

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    errorResponse = {
      status: 'fail',
      statusCode: 400,
      message: 'Invalid input data',
      errors: Object.values((err as any).errors).map((e: any) => e.message),
    };

    return res.status(400).json(errorResponse);
  }

  // Handle MongoDB duplicate key errors
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    errorResponse = {
      status: 'fail',
      statusCode: 409,
      message: `Duplicate value for field: ${field}`,
    };

    return res.status(409).json(errorResponse);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse = {
      status: 'fail',
      statusCode: 401,
      message: 'Invalid token',
    };

    return res.status(401).json(errorResponse);
  }

  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    errorResponse = {
      status: 'fail',
      statusCode: 401,
      message: 'Token has expired',
    };

    return res.status(401).json(errorResponse);
  }

  // Handle type errors
  if (err instanceof TypeError) {
    errorResponse = {
      status: 'fail',
      statusCode: 400,
      message: 'Invalid request format',
    };

    return res.status(400).json(errorResponse);
  }

  // Handle generic errors
  errorResponse = {
    status: 'error',
    statusCode: 500,
    message: 'Internal server error',
  };

  // In development, include error details
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      message: err.message,
      stack: err.stack,
    };
  }

  res.status(500).json(errorResponse);
};

/**
 * Async error wrapper to catch errors in async route handlers
 * Usage: router.post('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found middleware
 * Should be placed at the end of all routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorResponse: ErrorResponse = {
    status: 'fail',
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  };

  res.status(404).json(errorResponse);
};

export default errorHandler;
