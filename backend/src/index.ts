import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { testConnection } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { rateLimiter } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import kycRoutes from './routes/kyc';

const app: Application = express();

// Security middleware
if (env.HELMET_ENABLED) {
  app.use(helmet());
}

// CORS configuration
const corsOptions = {
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting
if (env.RATE_LIMIT_ENABLED) {
  app.use(
    rateLimiter(env.API_RATE_LIMIT_WINDOW * 60 * 1000, env.API_RATE_LIMIT_MAX_REQUESTS)
  );
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use(`${env.API_BASE_URL}/auth`, authRoutes);
app.use(`${env.API_BASE_URL}/loans`, loanRoutes);
app.use(`${env.API_BASE_URL}/kyc`, kycRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Patapesa Loan API',
    version: env.API_VERSION,
    documentation: '/api/docs',
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start listening
    const PORT = env.APP_PORT;
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Patapesa Loan API Server`);
      console.log('='.repeat(50));
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Server running on port: ${PORT}`);
      console.log(`API Base URL: ${env.API_BASE_URL}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
