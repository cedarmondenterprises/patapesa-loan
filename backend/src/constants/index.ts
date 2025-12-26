/**
 * Application Constants
 * Central location for all application-wide constants
 */

// API Configuration
export const API = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
  VERSION: 'v1',
} as const;

// Database Configuration
export const DATABASE = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  NAME: process.env.DB_NAME || 'patapesa_loan',
  USER: process.env.DB_USER || 'postgres',
  PASSWORD: process.env.DB_PASSWORD || '',
  POOL_MIN: parseInt(process.env.DB_POOL_MIN || '2', 10),
  POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
} as const;

// JWT Configuration
export const JWT = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  ALGORITHM: 'HS256',
} as const;

// Loan Configuration
export const LOAN = {
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 1000000,
  MIN_TENURE_MONTHS: 1,
  MAX_TENURE_MONTHS: 60,
  DEFAULT_INTEREST_RATE: 10, // percentage
  APPLICATION_FEE_PERCENTAGE: 2,
  PROCESSING_FEE_PERCENTAGE: 1,
} as const;

// Loan Status
export const LOAN_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DEFAULTED: 'DEFAULTED',
  CANCELLED: 'CANCELLED',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  LOAN_OFFICER: 'LOAN_OFFICER',
  BORROWER: 'BORROWER',
  SUPPORT: 'SUPPORT',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Cache Configuration
export const CACHE = {
  ENABLED: process.env.CACHE_ENABLED === 'true',
  TTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
} as const;

// Email Configuration
export const EMAIL = {
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@patapesa.com',
  FROM_NAME: 'PataPesa Loan',
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',
  DUPLICATE_ENTRY: 'Resource already exists',
  LOAN_NOT_FOUND: 'Loan not found',
  USER_NOT_FOUND: 'User not found',
  INVALID_LOAN_STATUS: 'Invalid loan status',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  OPERATION_SUCCESS: 'Operation completed successfully',
  LOAN_CREATED: 'Loan application created successfully',
  LOAN_UPDATED: 'Loan updated successfully',
  LOAN_APPROVED: 'Loan approved successfully',
  USER_CREATED: 'User created successfully',
  LOGIN_SUCCESS: 'Login successful',
} as const;

// Environment
export const ENVIRONMENT = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// Logging
export const LOGGING = {
  LEVEL: process.env.LOG_LEVEL || 'info',
  FORMAT: process.env.LOG_FORMAT || 'json',
} as const;

// Application Metadata
export const APP = {
  NAME: 'PataPesa Loan',
  VERSION: '1.0.0',
  AUTHOR: 'Cedar Mond Enterprises',
  DESCRIPTION: 'Digital Loan Management System',
} as const;
