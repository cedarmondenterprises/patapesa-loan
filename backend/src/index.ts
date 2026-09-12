import app from './app';
import { config } from './core/config';
import { migrate, pool } from './core/db';

async function start(): Promise<void> {
  await migrate();
  await pool.query('SELECT 1');
  const server = app.listen(config.port, () =>
    console.log(`PataPesa API listening on ${config.port}`),
  );
  const shutdown = (signal: string) => {
    console.log(`${signal} received; shutting down`);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('Unable to start PataPesa API', error);
  process.exit(1);
});
