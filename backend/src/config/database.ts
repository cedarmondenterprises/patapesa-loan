import { Pool, PoolClient } from 'pg';
import { env } from './env';
import logger from '../utils/logger';

let pool: Pool;

export const initializePool = (): Pool => {
  pool = new Pool({
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
  });

  pool.on('error', (err: Error) => {
    logger.error('Unexpected error on idle client', err);
  });

  return pool;
};

export const getPool = (): Pool => {
  if (!pool) {
    return initializePool();
  }
  return pool;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await getPool().connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

export const query = async (text: string, params?: unknown[]): Promise<any> => {
  try {
    const result = await getPool().query(text, params);
    return result;
  } catch (error) {
    logger.error('Query error:', error);
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  return getPool().connect();
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
};