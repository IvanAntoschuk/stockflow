import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoriesRouter } from './modules/catalog/categories.routes.js';
import { productsRouter } from './modules/catalog/products.routes.js';
import { suppliersRouter } from './modules/catalog/suppliers.routes.js';
import { warehousesRouter } from './modules/catalog/warehouses.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { movementsRouter } from './modules/inventory/movements.routes.js';
import { sendSuccess } from './utils/response.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.',
        },
      });
    },
  });

  app.get('/api/health', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: 'ok',
      service: 'stockflow-api',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/warehouses', warehousesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/movements', movementsRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
