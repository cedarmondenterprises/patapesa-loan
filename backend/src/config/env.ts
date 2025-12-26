/**
 * Environment Configuration Module
 * Handles all environment variables and validation
 */

import { z } from 'zod';

/**
 * Define the schema for environment variables
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Server Configuration
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database Configuration
  DATABASE_URL: z.string().url('Invalid database URL'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().min(1).max(65535).default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_SSL: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRE: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),

  // API Configuration
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('*'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Email Configuration (Optional for transactional emails)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Payment Gateway Configuration
  PAYMENT_GATEWAY_URL: z.string().url().optional(),
  PAYMENT_GATEWAY_API_KEY: z.string().optional(),
  PAYMENT_GATEWAY_SECRET: z.string().optional(),

  // AWS/Cloud Configuration (Optional)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // Third Party Services
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Redis Configuration (Optional)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Application-specific Configuration
  MAX_LOAN_AMOUNT: z.coerce.number().positive().default(1000000),
  MIN_LOAN_AMOUNT: z.coerce.number().positive().default(1000),
  DEFAULT_INTEREST_RATE: z.coerce.number().positive().default(5),
  MAX_LOAN_DURATION_MONTHS: z.coerce.number().positive().int().default(60),
  MIN_LOAN_DURATION_MONTHS: z.coerce.number().positive().int().default(1),

  // Application URLs
  FRONTEND_URL: z.string().url(),
  ADMIN_PANEL_URL: z.string().url().optional(),

  // Feature Flags
  ENABLE_2FA: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
  ENABLE_EMAIL_VERIFICATION: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
  ENABLE_SMS_NOTIFICATIONS: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
});

/**
 * Type definition for environment variables
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function validateEnv(): Environment {
  const env = { ...process.env };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors.map((error) => {
      const path = error.path.join('.');
      return `${path}: ${error.message}`;
    });

    throw new Error(
      `Invalid environment variables:\n${errors.join('\n')}`
    );
  }

  return result.data;
}

/**
 * Export validated environment configuration
 */
let validatedEnv: Environment | null = null;

export function getEnv(): Environment {
  if (!validatedEnv) {
    validatedEnv = validateEnv();
  }
  return validatedEnv;
}

/**
 * Export individual helpers for common configurations
 */
export const config = {
  isDevelopment: () => getEnv().NODE_ENV === 'development',
  isProduction: () => getEnv().NODE_ENV === 'production',
  isStaging: () => getEnv().NODE_ENV === 'staging',

  // Server
  server: {
    port: () => getEnv().PORT,
    host: () => getEnv().HOST,
    isDev: () => config.isDevelopment(),
  },

  // Database
  database: {
    url: () => getEnv().DATABASE_URL,
    host: () => getEnv().DB_HOST,
    port: () => getEnv().DB_PORT,
    name: () => getEnv().DB_NAME,
    user: () => getEnv().DB_USER,
    password: () => getEnv().DB_PASSWORD,
    ssl: () => getEnv().DB_SSL,
  },

  // JWT
  jwt: {
    secret: () => getEnv().JWT_SECRET,
    expire: () => getEnv().JWT_EXPIRE,
    refreshSecret: () => getEnv().JWT_REFRESH_SECRET,
    refreshExpire: () => getEnv().JWT_REFRESH_EXPIRE,
  },

  // API
  api: {
    version: () => getEnv().API_VERSION,
    prefix: () => getEnv().API_PREFIX,
    corsOrigin: () => getEnv().CORS_ORIGIN,
  },

  // Logging
  logging: {
    level: () => getEnv().LOG_LEVEL,
  },

  // Loan Configuration
  loan: {
    maxAmount: () => getEnv().MAX_LOAN_AMOUNT,
    minAmount: () => getEnv().MIN_LOAN_AMOUNT,
    defaultInterestRate: () => getEnv().DEFAULT_INTEREST_RATE,
    maxDurationMonths: () => getEnv().MAX_LOAN_DURATION_MONTHS,
    minDurationMonths: () => getEnv().MIN_LOAN_DURATION_MONTHS,
  },

  // URLs
  urls: {
    frontend: () => getEnv().FRONTEND_URL,
    adminPanel: () => getEnv().ADMIN_PANEL_URL,
  },

  // Features
  features: {
    enable2FA: () => getEnv().ENABLE_2FA,
    enableEmailVerification: () => getEnv().ENABLE_EMAIL_VERIFICATION,
    enableSmsNotifications: () => getEnv().ENABLE_SMS_NOTIFICATIONS,
  },
};

export default getEnv;
