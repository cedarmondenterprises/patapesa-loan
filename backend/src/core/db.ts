import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from './config';

export const pool = new Pool(
  config.databaseUrl
    ? {
        connectionString: config.databaseUrl,
        ssl: config.databaseSsl ? { rejectUnauthorized: true } : undefined,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }
    : {
        host: config.databaseHost,
        port: config.databasePort,
        user: config.databaseUser,
        password: config.databasePassword,
        database: config.databaseName,
      },
);

export async function query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await pool.query<T>(sql, params)).rows;
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function migrate(): Promise<void> {
  if (!config.autoMigrate) return;
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [734_281_901]);
    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    await client.query(await readFile(schemaPath, 'utf8'));
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [734_281_901]).catch(() => undefined);
    client.release();
  }
}
