import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import {
  analyticsLowStockQuerySchema,
  analyticsMovementByTypeQuerySchema,
  analyticsMovementTrendQuerySchema,
  analyticsStockBreakdownQuerySchema,
  analyticsSummaryQuerySchema,
} from './analytics.schemas.js';
import {
  getAnalyticsSummary,
  getLowStockReport,
  getMovementByType,
  getMovementTrend,
  getStockBreakdown,
} from './analytics.service.js';

export async function summary(req: Request, res: Response) {
  const query = analyticsSummaryQuerySchema.parse(req.query);
  sendSuccess(res, await getAnalyticsSummary(query));
}

export async function stockBreakdown(req: Request, res: Response) {
  const query = analyticsStockBreakdownQuerySchema.parse(req.query);
  sendSuccess(res, await getStockBreakdown(query));
}

export async function lowStock(req: Request, res: Response) {
  const query = analyticsLowStockQuerySchema.parse(req.query);
  const result = await getLowStockReport(query);
  sendSuccess(res, result.items, 200, result.meta);
}

export async function movementTrend(req: Request, res: Response) {
  const query = analyticsMovementTrendQuerySchema.parse(req.query);
  sendSuccess(res, await getMovementTrend(query));
}

export async function movementByType(req: Request, res: Response) {
  const query = analyticsMovementByTypeQuerySchema.parse(req.query);
  sendSuccess(res, await getMovementByType(query));
}
