import { createServer } from 'node:http';
import type { Server } from 'node:http';
import app from './app';
import { config } from './core/config';
import { migrate, pool } from './core/db';
import { renderMetrics } from './core/metrics';

const closeServer = (server: Server) =>
  new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

async function start(): Promise<void> {
  await migrate();
  await pool.query('SELECT 1');

  const metricsServer = createServer((req, res) => {
    const path = req.url?.split('?')[0];
    if (req.method !== 'GET' || path !== '/metrics') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found\n');
      return;
    }
    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
    res.end(renderMetrics());
  });
  metricsServer.listen(config.metricsPort, '0.0.0.0', () =>
    console.log(`PataPesa private metrics listening on ${config.metricsPort}`),
  );

  const server = app.listen(config.port, () =>
    console.log(`PataPesa API listening on ${config.port}`),
  );
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down`);
    void Promise.all([closeServer(server), closeServer(metricsServer)])
      .then(() => pool.end())
      .finally(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('Unable to start PataPesa API', error);
  process.exit(1);
});
