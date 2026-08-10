import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_PORT: parseInt(process.env.APP_PORT || '5000', 10),
  API_BASE_URL: process.env.API_BASE_URL || '/api/v1',
  API_VERSION: process.env.API_VERSION || '1.0.0',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'patapesa',
  DB_PASSWORD: process.env.DB_PASSWORD || 'patapesa_dev_password',
  DB_NAME: process.env.DB_NAME || 'patapesa_db',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://patapesa:patapesa_dev_password@localhost:5432/patapesa_db',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'redis_dev_password',
  REDIS_URL: process.env.REDIS_URL || 'redis://default:redis_dev_password@localhost:6379/0',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:8080',

  // Security
  HELMET_ENABLED: process.env.HELMET_ENABLED !== 'false',
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
  API_RATE_LIMIT_WINDOW: parseInt(process.env.API_RATE_LIMIT_WINDOW || '15', 10),
  API_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@patapesa-loan.com',

  // SMS Configuration
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'twilio',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  // Payment Gateway
  PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY || 'stripe',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',

  // Credit Scoring
  ENABLE_ML_SCORING: process.env.ENABLE_ML_SCORING === 'true',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png').split(','),

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || '',

  // Feature Flags
  ENABLE_KYC: process.env.ENABLE_KYC !== 'false',
  ENABLE_REPAYMENT: process.env.ENABLE_REPAYMENT !== 'false',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
};