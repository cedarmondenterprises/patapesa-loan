import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function requiredInProduction(name: string, developmentFallback = ''): string {
  const value = process.env[name]?.trim() || developmentFallback;
  if (isProduction && !value) throw new Error(`${name} must be configured in production`);
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer`);
  return value;
}

const jwtSecret = requiredInProduction('JWT_SECRET', 'development-only-secret-change-me');
const kycEncryptionKey = requiredInProduction(
  'KYC_ENCRYPTION_KEY',
  'development-only-kyc-key-change-me',
);

if (isProduction && jwtSecret.length < 32)
  throw new Error('JWT_SECRET must contain at least 32 characters');
if (isProduction && kycEncryptionKey.length < 32)
  throw new Error('KYC_ENCRYPTION_KEY must contain at least 32 characters');

export const config = {
  nodeEnv,
  isProduction,
  port: positiveInteger('APP_PORT', Number(process.env.PORT || 5000)),
  databaseUrl: process.env.DATABASE_URL?.trim() || '',
  databaseHost: process.env.DB_HOST?.trim() || 'localhost',
  databasePort: positiveInteger('DB_PORT', 5432),
  databaseUser: requiredInProduction('DB_USER', 'patapesa'),
  databasePassword: requiredInProduction('DB_PASSWORD', 'patapesa_dev_password'),
  databaseName: requiredInProduction('DB_NAME', 'patapesa_db'),
  databaseSsl: process.env.DB_SSL === 'true',
  autoMigrate: process.env.AUTO_MIGRATE !== 'false',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRATION || '7d',
  jwtIssuer: 'patapesa-api',
  jwtAudience: 'patapesa-web',
  authCookieName: isProduction ? '__Host-patapesa_session' : 'patapesa_session',
  sessionMaxAgeMs: positiveInteger('SESSION_MAX_AGE_HOURS', 168) * 60 * 60 * 1000,
  kycEncryptionKey,
  corsOrigins: requiredInProduction('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST?.trim() || '',
    port: positiveInteger('SMTP_PORT', 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER?.trim() || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM?.trim() || '',
  },
  publicAppUrl: requiredInProduction('PUBLIC_APP_URL', 'http://localhost:3000').replace(/\/$/, ''),
};

if (config.isProduction && !config.corsOrigins.includes(config.publicAppUrl)) {
  throw new Error('CORS_ORIGIN must include PUBLIC_APP_URL');
}
if (config.isProduction && (!config.smtp.host || !config.smtp.from)) {
  throw new Error('SMTP_HOST and EMAIL_FROM must be configured in production');
}
if (Boolean(config.smtp.user) !== Boolean(config.smtp.password)) {
  throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together');
}
