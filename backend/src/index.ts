import app from './app';
import { config } from './core/config';
import { pool } from './core/db';

async function start(): Promise<void> {
  await pool.query('SELECT 1');
  app.listen(config.port, () => console.log(`Patapesa API listening on ${config.port}`));
}

start().catch((error) => { console.error('Unable to start Patapesa API', error); process.exit(1); });
