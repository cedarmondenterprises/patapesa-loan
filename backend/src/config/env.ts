import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../..', '.env') });

interface EnvConfig {
  // Application
  NODE_ENV: string;
  APP_NAME: string;
  APP_URL: string;
  APP_PORT: number;
  LOG_LEVEL: string;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SSL: boolean;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;

  // API
  API_VERSION: string;
  API_BASE_URL: string;
  API_TIMEOUT: number;
  API_RATE_LIMIT_WINDOW: number;
  API_RATE_LIMIT_MAX_REQUESTS: number;

  // Email
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;
  MAIL_FROM_NAME: string;

  // Payment Gateway
  PAYMENT_PROVIDER: string;
  MPESA_API_URL: string;
  MPESA_CONSUMER_KEY: string;
  MPESA_CONSUMER_SECRET: string;

  // Security
  CORS_ORIGIN: string;
  CSRF_PROTECTION: boolean;
  HELMET_ENABLED: boolean;
  RATE_LIMIT_ENABLED: boolean;

  // Loan Configuration
  MIN_LOAN_AMOUNT: number;
  MAX_LOAN_AMOUNT: number;
  DEFAULT_INTEREST_RATE: number;
  DEFAULT_LOAN_TERM_MONTHS: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value as string;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

export const env: EnvConfig = {
  // Application
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  APP_NAME: getEnvVar('APP_NAME', 'Patapesa Loan'),
  APP_URL: getEnvVar('APP_URL', 'http://localhost:3000'),
  APP_PORT: getEnvNumber('APP_PORT', 5000),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),

  // Database
  DB_HOST: getEnvVar('DB_HOST', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 5432),
  DB_USER: getEnvVar('DB_USER', 'postgres'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD'),
  DB_NAME: getEnvVar('DB_NAME', 'patapesa_loan'),
  DB_SSL: getEnvBoolean('DB_SSL', false),
  DB_POOL_MIN: getEnvNumber('DB_POOL_MIN', 2),
  DB_POOL_MAX: getEnvNumber('DB_POOL_MAX', 10),

  // Redis
  REDIS_HOST: getEnvVar('REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnvNumber('REDIS_PORT', 6379),
  REDIS_PASSWORD: getEnvVar('REDIS_PASSWORD', ''),
  REDIS_DB: getEnvNumber('REDIS_DB', 0),
  REDIS_URL: getEnvVar('REDIS_URL', 'redis://localhost:6379/0'),

  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRATION: getEnvVar('JWT_EXPIRATION', '7d'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRATION: getEnvVar('JWT_REFRESH_EXPIRATION', '30d'),

  // API
  API_VERSION: getEnvVar('API_VERSION', 'v1'),
  API_BASE_URL: getEnvVar('API_BASE_URL', '/api/v1'),
  API_TIMEOUT: getEnvNumber('API_TIMEOUT', 30000),
  API_RATE_LIMIT_WINDOW: getEnvNumber('API_RATE_LIMIT_WINDOW', 15),
  API_RATE_LIMIT_MAX_REQUESTS: getEnvNumber('API_RATE_LIMIT_MAX_REQUESTS', 100),

  // Email
  MAIL_HOST: getEnvVar('MAIL_HOST', 'smtp.gmail.com'),
  MAIL_PORT: getEnvNumber('MAIL_PORT', 587),
  MAIL_USER: getEnvVar('MAIL_USER'),
  MAIL_PASSWORD: getEnvVar('MAIL_PASSWORD'),
  MAIL_FROM: getEnvVar('MAIL_FROM', 'noreply@patapesa-loan.com'),
  MAIL_FROM_NAME: getEnvVar('MAIL_FROM_NAME', 'Patapesa Loan System'),

  // Payment Gateway
  PAYMENT_PROVIDER: getEnvVar('PAYMENT_PROVIDER', 'mpesa'),
  MPESA_API_URL: getEnvVar('MPESA_API_URL', 'https://api.sandbox.safaricom.co.ke'),
  MPESA_CONSUMER_KEY: getEnvVar('MPESA_CONSUMER_KEY', ''),
  MPESA_CONSUMER_SECRET: getEnvVar('MPESA_CONSUMER_SECRET', ''),

  // Security
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  CSRF_PROTECTION: getEnvBoolean('CSRF_PROTECTION', true),
  HELMET_ENABLED: getEnvBoolean('HELMET_ENABLED', true),
  RATE_LIMIT_ENABLED: getEnvBoolean('RATE_LIMIT_ENABLED', true),

  // Loan Configuration
  MIN_LOAN_AMOUNT: getEnvNumber('MIN_LOAN_AMOUNT', 1000),
  MAX_LOAN_AMOUNT: getEnvNumber('MAX_LOAN_AMOUNT', 1000000),
  DEFAULT_INTEREST_RATE: getEnvNumber('DEFAULT_INTEREST_RATE', 0.18),
  DEFAULT_LOAN_TERM_MONTHS: getEnvNumber('DEFAULT_LOAN_TERM_MONTHS', 12),
};

export default env;
