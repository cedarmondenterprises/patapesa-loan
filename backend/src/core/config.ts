import dotenv from 'dotenv';
dotenv.config();

const productionSecret = (name: string, fallback: string): string => {
  const value = process.env[name] || fallback;
  if (process.env.NODE_ENV === 'production' && value === fallback) throw new Error(`${name} must be configured in production`);
  return value;
};

export const config = {
  port: Number(process.env.APP_PORT || process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: productionSecret('JWT_SECRET', 'development-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRATION || '7d',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((value) => value.trim()),
};
