import { api, getPaginated } from './client';
import type { ApiSuccess } from '@/types/api';
import type {
  AnalyticsParams,
  AnalyticsSummary,
  LowStockRow,
  MovementByType,
  MovementTrend,
  StockBreakdown,
} from '@/types/analytics';

export async function getAnalyticsSummary(params: AnalyticsParams = {}): Promise<AnalyticsSummary> {
  const { data } = await api.get<ApiSuccess<AnalyticsSummary>>('/analytics/summary', { params });
  return data.data;
}

export async function getStockBreakdown(
  params: AnalyticsParams & { groupBy?: 'category' | 'supplier' | 'warehouse' } = {},
): Promise<StockBreakdown> {
  const { data } = await api.get<ApiSuccess<StockBreakdown>>('/analytics/stock-breakdown', {
    params,
  });
  return data.data;
}

export function getLowStockReport(params: AnalyticsParams = {}) {
  return getPaginated<LowStockRow>('/analytics/low-stock', params);
}

export async function getMovementTrend(
  params: AnalyticsParams & { granularity?: 'day' | 'week' | 'month' } = {},
): Promise<MovementTrend> {
  const { data } = await api.get<ApiSuccess<MovementTrend>>('/analytics/movements/trend', {
    params,
  });
  return data.data;
}

export async function getMovementByType(params: AnalyticsParams = {}): Promise<MovementByType> {
  const { data } = await api.get<ApiSuccess<MovementByType>>('/analytics/movements/by-type', {
    params,
  });
  return data.data;
}
