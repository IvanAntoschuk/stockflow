import { z } from 'zod';
import { movementTypeSchema } from '../inventory/inventory.schemas.js';

const id = z.string().trim().min(1);
const booleanQuery = z.preprocess(
  (value) => value === true || value === 'true',
  z.boolean(),
);

const filterFields = {
  productId: id.optional(),
  warehouseId: id.optional(),
  categoryId: id.optional(),
  supplierId: id.optional(),
};

const dateRangeFields = {
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
};

const validDateRange = (value: { from?: Date; to?: Date }) =>
  !value.from || !value.to || value.from <= value.to;

const dateRangeMessage = {
  path: ['to'],
  message: 'The end date must be after the start date',
};

export const analyticsSummaryQuerySchema = z
  .object({ ...filterFields, ...dateRangeFields })
  .refine(validDateRange, dateRangeMessage);

export const analyticsStockBreakdownQuerySchema = z.object({
  ...filterFields,
  groupBy: z.enum(['category', 'supplier', 'warehouse']).default('category'),
  includeArchived: booleanQuery.default(false),
});

export const analyticsLowStockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  status: z.enum(['out', 'low']).optional(),
  includeArchived: booleanQuery.default(false),
  ...filterFields,
});

export const analyticsMovementTrendQuerySchema = z
  .object({
    ...filterFields,
    ...dateRangeFields,
    type: movementTypeSchema.optional(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
  })
  .refine(validDateRange, dateRangeMessage);

export const analyticsMovementByTypeQuerySchema = z
  .object({
    ...filterFields,
    ...dateRangeFields,
    type: movementTypeSchema.optional(),
  })
  .refine(validDateRange, dateRangeMessage);

export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuerySchema>;
export type AnalyticsStockBreakdownQuery = z.infer<typeof analyticsStockBreakdownQuerySchema>;
export type AnalyticsLowStockQuery = z.infer<typeof analyticsLowStockQuerySchema>;
export type AnalyticsMovementTrendQuery = z.infer<typeof analyticsMovementTrendQuerySchema>;
export type AnalyticsMovementByTypeQuery = z.infer<typeof analyticsMovementByTypeQuerySchema>;
