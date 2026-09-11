import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from './config';

export const pool = new Pool(config.databaseUrl ? {
  connectionString: config.databaseUrl,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
} : {
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'patapesa', password: process.env.DB_PASSWORD || 'patapesa_dev_password',
  database: process.env.DB_NAME || 'patapesa_db',
});

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query<T>(sql, params)).rows;
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
