import { randomUUID } from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './core/routes';
import { config } from './core/config';
import { pool } from './core/db';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const id = req.get('x-request-id')?.slice(0, 100) || randomUUID();
  res.setHeader('x-request-id', id);
  res.locals.requestId = id;
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
  }),
);
app.use(
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: true, legacyHeaders: false }),
);
if (config.nodeEnv !== 'test') app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && !config.corsOrigins.includes(origin)) {
      res.status(403).json({ success: false, message: 'Request origin is not allowed' });
      return;
    }
  }
  next();
});
app.get('/api/health/live', (_req, res) => res.json({ status: 'healthy' }));
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'unavailable' });
  }
});
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(
  (
    error: Error & { status?: number; type?: string; code?: string; constraint?: string },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const requestId = res.locals.requestId as string;
    if (error.type === 'entity.parse.failed') {
      res
        .status(400)
        .json({ success: false, message: 'Request body is not valid JSON', requestId });
      return;
    }
    if (error.code === '23505') {
      const duplicateApplication = [
        'idx_loan_applications_request_id',
      ].includes(error.constraint || '');
      res.status(409).json({
        success: false,
        message: duplicateApplication
          ? 'This loan application has already been received'
          : 'That account or identity record already exists',
        requestId,
      });
      return;
    }
    console.error({
      requestId,
      message: error.message,
      ...(!config.isProduction ? { stack: error.stack } : {}),
    });
    res.status(error.status || 500).json({
      success: false,
      message: config.isProduction ? 'An unexpected error occurred' : error.message,
      requestId,
    });
  },
);
export default app;
