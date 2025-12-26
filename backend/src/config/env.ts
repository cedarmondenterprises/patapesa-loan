/**
 * Environment Variable Management and Configuration
 * 
 * This module handles all environment variables and provides
 * type-safe access to configuration values across the application.
 */

interface EnvironmentConfig {
  // Node Environment
  nodeEnv: 'development' | 'staging' | 'production' | 'test';
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;

  // Server Configuration
  port: number;
  host: string;
  baseUrl: string;

  // Database Configuration
  database: {
    url: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    poolSize: number;
    connectionTimeout: number;
  };

  // Authentication & Security
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
    refreshTokenSecret: string;
    refreshTokenExpiration: string;
    bcryptRounds: number;
  };

  // External Services
  services: {
    // Payment Gateway
    paymentGateway: {
      provider: string;
      apiKey: string;
      apiSecret: string;
      merchantId: string;
      webhookSecret: string;
    };
    // SMS Service
    sms: {
      provider: string;
      apiKey: string;
      apiUrl: string;
      senderId: string;
    };
    // Email Service
    email: {
      provider: string;
      apiKey: string;
      fromAddress: string;
      fromName: string;
    };
  };

  // Logging Configuration
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    format: string;
    prettyPrint: boolean;
  };

  // CORS Configuration
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };

  // File Upload
  fileUpload: {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    uploadDir: string;
  };

  // Feature Flags
  features: {
    enableSms: boolean;
    enableEmail: boolean;
    enablePayments: boolean;
  };
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
  ];

  const missing = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Parse and validate port number
 */
function parsePort(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${value}`);
  }
  return port;
}

/**
 * Parse boolean environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Parse CSV string into array
 */
function parseCSV(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
}

/**
 * Load and parse all environment variables
 */
function loadConfig(): EnvironmentConfig {
  validateEnvironment();

  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvironmentConfig['nodeEnv'];

  return {
    // Node Environment
    nodeEnv,
    isDev: nodeEnv === 'development',
    isProd: nodeEnv === 'production',
    isTest: nodeEnv === 'test',

    // Server Configuration
    port: parsePort(process.env.PORT, 3000),
    host: process.env.HOST || 'localhost',
    baseUrl: process.env.BASE_URL || `http://localhost:${parsePort(process.env.PORT, 3000)}`,

    // Database Configuration
    database: {
      url: process.env.DATABASE_URL || '',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parsePort(process.env.DATABASE_PORT, 5432),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'patapesa_loan',
      ssl: parseBoolean(process.env.DATABASE_SSL, false),
      poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000', 10),
    },

    // Authentication & Security
    auth: {
      jwtSecret: process.env.JWT_SECRET || '',
      jwtExpiration: process.env.JWT_EXPIRATION || '24h',
      refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || '',
      refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },

    // External Services
    services: {
      paymentGateway: {
        provider: process.env.PAYMENT_PROVIDER || 'stripe',
        apiKey: process.env.PAYMENT_API_KEY || '',
        apiSecret: process.env.PAYMENT_API_SECRET || '',
        merchantId: process.env.PAYMENT_MERCHANT_ID || '',
        webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
      },
      sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        apiKey: process.env.SMS_API_KEY || '',
        apiUrl: process.env.SMS_API_URL || '',
        senderId: process.env.SMS_SENDER_ID || 'PataPesa',
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY || '',
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@patapesa.com',
        fromName: process.env.EMAIL_FROM_NAME || 'PataPesa',
      },
    },

    // Logging Configuration
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as EnvironmentConfig['logging']['level'],
      format: process.env.LOG_FORMAT || 'json',
      prettyPrint: parseBoolean(process.env.LOG_PRETTY_PRINT, nodeEnv === 'development'),
    },

    // CORS Configuration
    cors: {
      enabled: parseBoolean(process.env.CORS_ENABLED, true),
      origins: parseCSV(process.env.CORS_ORIGINS, ['http://localhost:3000']),
      credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
    },

    // Rate Limiting
    rateLimit: {
      enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, true),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // File Upload
    fileUpload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
      allowedMimeTypes: parseCSV(
        process.env.ALLOWED_MIME_TYPES,
        ['application/pdf', 'image/jpeg', 'image/png', 'application/msword']
      ),
      uploadDir: process.env.UPLOAD_DIR || './uploads',
    },

    // Feature Flags
    features: {
      enableSms: parseBoolean(process.env.FEATURE_ENABLE_SMS, true),
      enableEmail: parseBoolean(process.env.FEATURE_ENABLE_EMAIL, true),
      enablePayments: parseBoolean(process.env.FEATURE_ENABLE_PAYMENTS, true),
    },
  };
}

// Load configuration once at module initialization
let config: EnvironmentConfig;

try {
  config = loadConfig();
} catch (error) {
  console.error('Failed to load environment configuration:', error);
  process.exit(1);
}

/**
 * Export the configuration object
 */
export default config;

/**
 * Export typed configuration getter for type safety
 */
export const getConfig = (): EnvironmentConfig => config;

/**
 * Export individual configuration sections for convenience
 */
export const {
  nodeEnv,
  isDev,
  isProd,
  isTest,
  port,
  host,
  baseUrl,
  database,
  auth,
  services,
  logging,
  cors,
  rateLimit,
  fileUpload,
  features,
} = config;

/**
 * Type export for use in other modules
 */
export type { EnvironmentConfig };
