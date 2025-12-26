/**
 * Custom AppError class for centralized error handling
 * Extends the native Error class with additional properties for HTTP responses
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly to support instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON object for API responses
   */
  toJSON() {
    return {
      status: 'error',
      statusCode: this.statusCode,
      message: this.message,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Specific error classes for different scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class BadGatewayError extends AppError {
  constructor(message: string = 'Bad gateway') {
    super(message, 502, false);
    Object.setPrototypeOf(this, BadGatewayError.prototype);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

/**
 * Helper function to safely convert any error to AppError
 */
export const normalizeError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }

  if (typeof error === 'string') {
    return new InternalServerError(error);
  }

  return new InternalServerError('An unexpected error occurred');
};
