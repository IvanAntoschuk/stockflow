import { describe, expect, it } from 'vitest';
import {
  analyticsLowStockQuerySchema,
  analyticsMovementByTypeQuerySchema,
  analyticsMovementTrendQuerySchema,
  analyticsStockBreakdownQuerySchema,
  analyticsSummaryQuerySchema,
} from '../src/modules/analytics/analytics.schemas.js';

const sharedFilters = {
  productId: 'prod-1',
  warehouseId: 'wh-1',
  categoryId: 'cat-1',
  supplierId: 'sup-1',
};

describe('analyticsStockBreakdownQuerySchema', () => {
  it('defaults groupBy to category and includeArchived to false', () => {
    expect(analyticsStockBreakdownQuerySchema.parse({})).toEqual({
      groupBy: 'category',
      includeArchived: false,
    });
  });

  it('accepts other groupBy values and coerces includeArchived', () => {
    expect(analyticsStockBreakdownQuerySchema.parse({ groupBy: 'warehouse' }).groupBy).toBe(
      'warehouse',
    );
    expect(
      analyticsStockBreakdownQuerySchema.parse({ includeArchived: 'true' }).includeArchived,
    ).toBe(true);
  });

  it('rejects an unknown groupBy value', () => {
    expect(analyticsStockBreakdownQuerySchema.safeParse({ groupBy: 'color' }).success).toBe(false);
  });
});

describe('analyticsMovementTrendQuerySchema', () => {
  it('defaults granularity to day', () => {
    expect(analyticsMovementTrendQuerySchema.parse({}).granularity).toBe('day');
  });

  it('accepts week and month granularity and a valid movement type', () => {
    expect(analyticsMovementTrendQuerySchema.parse({ granularity: 'week' }).granularity).toBe(
      'week',
    );
    expect(analyticsMovementTrendQuerySchema.parse({ granularity: 'month' }).granularity).toBe(
      'month',
    );
    expect(analyticsMovementTrendQuerySchema.parse({ type: 'ADJUSTMENT' }).type).toBe('ADJUSTMENT');
  });

  it('rejects an unknown granularity or type', () => {
    expect(analyticsMovementTrendQuerySchema.safeParse({ granularity: 'year' }).success).toBe(
      false,
    );
    expect(analyticsMovementTrendQuerySchema.safeParse({ type: 'SALE' }).success).toBe(false);
  });
});

describe('analyticsLowStockQuerySchema', () => {
  it('defaults pagination and includeArchived', () => {
    expect(analyticsLowStockQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      includeArchived: false,
    });
  });

  it('accepts out and low status values and rejects others', () => {
    expect(analyticsLowStockQuerySchema.parse({ status: 'out' }).status).toBe('out');
    expect(analyticsLowStockQuerySchema.parse({ status: 'low' }).status).toBe('low');
    expect(analyticsLowStockQuerySchema.safeParse({ status: 'critical' }).success).toBe(false);
  });
});

describe('shared analytics filters', () => {
  it.each([
    ['summary', analyticsSummaryQuerySchema],
    ['stock breakdown', analyticsStockBreakdownQuerySchema],
    ['low stock', analyticsLowStockQuerySchema],
    ['movement trend', analyticsMovementTrendQuerySchema],
    ['movement by type', analyticsMovementByTypeQuerySchema],
  ])('preserves all shared filters for %s', (_name, schema) => {
    expect(schema.parse(sharedFilters)).toMatchObject(sharedFilters);
  });

  it('rejects blank filter identifiers', () => {
    expect(analyticsSummaryQuerySchema.safeParse({ productId: '' }).success).toBe(false);
    expect(analyticsStockBreakdownQuerySchema.safeParse({ warehouseId: '' }).success).toBe(false);
    expect(analyticsLowStockQuerySchema.safeParse({ categoryId: '' }).success).toBe(false);
    expect(analyticsMovementTrendQuerySchema.safeParse({ supplierId: '' }).success).toBe(false);
  });
});

describe('analytics date ranges', () => {
  it.each([
    ['summary', analyticsSummaryQuerySchema],
    ['movement trend', analyticsMovementTrendQuerySchema],
    ['movement by type', analyticsMovementByTypeQuerySchema],
  ])('accepts ordered dates and rejects reversed dates for %s', (_name, schema) => {
    expect(schema.safeParse({ from: '2026-01-01', to: '2026-02-01' }).success).toBe(true);
    expect(schema.safeParse({ from: '2026-02-01', to: '2026-01-01' }).success).toBe(false);
  });

  it('accepts a valid movement type for the by-type report', () => {
    expect(analyticsMovementByTypeQuerySchema.parse({ type: 'RECEIPT' }).type).toBe('RECEIPT');
    expect(analyticsMovementByTypeQuerySchema.safeParse({ type: 'SALE' }).success).toBe(false);
  });
});
