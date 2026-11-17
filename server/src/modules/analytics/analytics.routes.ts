import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
  lowStock,
  movementByType,
  movementTrend,
  stockBreakdown,
  summary,
} from './analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.get('/summary', summary);
analyticsRouter.get('/stock-breakdown', stockBreakdown);
analyticsRouter.get('/low-stock', lowStock);
analyticsRouter.get('/movements/trend', movementTrend);
analyticsRouter.get('/movements/by-type', movementByType);
