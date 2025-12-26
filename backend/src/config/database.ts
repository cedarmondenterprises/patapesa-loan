import { Pool, PoolClient, QueryResult } from 'pg';
import logger from '../utils/logger';

/**
 * PostgreSQL connection pool configuration
 */
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'patapesa',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
});

/**
 * Handle pool errors
 */
pool.on('error', (err: Error) => {
  logger.error('Unexpected pool error:', err);
});

pool.on('connect', () => {
  logger.debug('New client connected to database pool');
});

pool.on('remove', () => {
  logger.debug('Client removed from database pool');
});

/**
 * Execute a single query
 * @param text SQL query string
 * @param values Query parameters
 * @returns Query result
 */
export async function query<T = any>(
  text: string,
  values?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, values);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, { text, duration });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query error', { text, error, duration });
    throw error;
  }
}

/**
 * Execute a query and return the first row
 * @param text SQL query string
 * @param values Query parameters
 * @returns First row or undefined
 */
export async function queryOne<T = any>(
  text: string,
  values?: any[]
): Promise<T | undefined> {
  const result = await query<T>(text, values);
  return result.rows[0];
}

/**
 * Execute a query and return all rows
 * @param text SQL query string
 * @param values Query parameters
 * @returns Array of rows
 */
export async function queryMany<T = any>(
  text: string,
  values?: any[]
): Promise<T[]> {
  const result = await query<T>(text, values);
  return result.rows;
}

/**
 * Transaction callback function type
 */
export type TransactionCallback<T = any> = (client: PoolClient) => Promise<T>;

/**
 * Execute queries within a transaction
 * @param callback Transaction callback function
 * @returns Transaction result
 */
export async function transaction<T = any>(
  callback: TransactionCallback<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Transaction helper for executing queries
 * Provides a simpler interface for running queries within a transaction
 */
export class TransactionClient {
  constructor(private client: PoolClient) {}

  /**
   * Execute a query within the transaction
   */
  async query<T = any>(
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.client.query<T>(text, values);
      const duration = Date.now() - start;
      logger.debug(`Transaction query executed in ${duration}ms`, { text, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Transaction query error', { text, error, duration });
      throw error;
    }
  }

  /**
   * Execute a query and return the first row
   */
  async queryOne<T = any>(
    text: string,
    values?: any[]
  ): Promise<T | undefined> {
    const result = await this.query<T>(text, values);
    return result.rows[0];
  }

  /**
   * Execute a query and return all rows
   */
  async queryMany<T = any>(
    text: string,
    values?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(text, values);
    return result.rows;
  }
}

/**
 * Execute queries within a transaction with a simpler interface
 * @param callback Transaction callback function
 * @returns Transaction result
 */
export async function withTransaction<T = any>(
  callback: (txClient: TransactionClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const txClient = new TransactionClient(client);
    const result = await callback(txClient);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Batch insert multiple records
 * @param tableName Table name
 * @param records Array of records to insert
 * @param columns Column names
 * @returns Insert result
 */
export async function batchInsert<T = any>(
  tableName: string,
  records: Record<string, any>[],
  columns: string[]
): Promise<QueryResult<T>> {
  if (records.length === 0) {
    throw new Error('No records to insert');
  }

  const placeholders = records
    .map((_, index) => {
      const columnCount = columns.length;
      const startParam = index * columnCount + 1;
      const params = Array.from({ length: columnCount }, (_, i) => `$${startParam + i}`);
      return `(${params.join(',')})`;
    })
    .join(',');

  const values: any[] = [];
  records.forEach((record) => {
    columns.forEach((col) => {
      values.push(record[col]);
    });
  });

  const columnList = columns.join(',');
  const text = `INSERT INTO ${tableName} (${columnList}) VALUES ${placeholders} RETURNING *`;

  return query<T>(text, values);
}

/**
 * Get database pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rowCount === 1;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error });
    throw error;
  }
}

export default {
  query,
  queryOne,
  queryMany,
  transaction,
  withTransaction,
  batchInsert,
  getPoolStats,
  healthCheck,
  closePool,
};
