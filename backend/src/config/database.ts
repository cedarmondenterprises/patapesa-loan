import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

/**
 * Database configuration interface
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl?: boolean | object;
}

/**
 * Get database configuration from environment variables
 */
function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'patapesa_loan',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
    ssl: process.env.DB_SSL === 'true' ? true : false,
  };
}

/**
 * Create and manage database pool
 */
class DatabasePool {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    this.config = config || getDatabaseConfig();
    this.pool = new Pool(this.config);

    // Event listeners for pool
    this.pool.on('connect', () => {
      logger.info('New client connected to database pool');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    this.pool.on('remove', () => {
      logger.info('Client removed from database pool');
    });
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      logger.debug('Client acquired from pool');
      return client;
    } catch (error) {
      logger.error('Failed to acquire client from pool', error);
      throw error;
    }
  }

  /**
   * Execute a query using the pool
   */
  async query<T = any>(
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    try {
      const result = await this.pool.query<T>(text, values);
      const duration = Date.now() - startTime;
      logger.debug(`Query executed in ${duration}ms`, { query: text, rows: result.rows.length });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Query failed after ${duration}ms`, { query: text, error });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      logger.debug('Transaction committed');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * End the pool and close all connections
   */
  async end(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database pool ended');
    } catch (error) {
      logger.error('Error ending database pool', error);
      throw error;
    }
  }

  /**
   * Check database connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      logger.info('Database health check passed');
      return !!result.rows.length;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Execute query with automatic client management
   */
  async withClient<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }
}

// Create singleton instance
let dbPool: DatabasePool | null = null;

/**
 * Initialize and get database pool instance
 */
export function initializeDatabase(config?: DatabaseConfig): DatabasePool {
  if (!dbPool) {
    dbPool = new DatabasePool(config);
    logger.info('Database pool initialized');
  }
  return dbPool;
}

/**
 * Get the database pool instance
 */
export function getDatabase(): DatabasePool {
  if (!dbPool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return dbPool;
}

/**
 * Close the database pool
 */
export async function closeDatabase(): Promise<void> {
  if (dbPool) {
    await dbPool.end();
    dbPool = null;
  }
}

export { DatabasePool, DatabaseConfig, PoolClient };
