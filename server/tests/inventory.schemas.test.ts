import { describe, expect, it } from 'vitest';
import {
  createMovementSchema,
  createTransferSchema,
  inventoryListQuerySchema,
  movementListQuerySchema,
  movementTypeSchema,
  movementTypes,
} from '../src/modules/inventory/inventory.schemas.js';

describe('movement types', () => {
  it('exposes the five supported movement types', () => {
    expect(movementTypes).toEqual([
      'RECEIPT',
      'ISSUE',
      'ADJUSTMENT',
      'TRANSFER_IN',
      'TRANSFER_OUT',
    ]);
    expect(movementTypeSchema.parse('TRANSFER_IN')).toBe('TRANSFER_IN');
    expect(movementTypeSchema.safeParse('SALE').success).toBe(false);
  });

  it('validates the movement list type filter', () => {
    expect(movementListQuerySchema.parse({ type: 'ISSUE' }).type).toBe('ISSUE');
    expect(movementListQuerySchema.safeParse({ type: 'SALE' }).success).toBe(false);
  });
});

describe('inventoryListQuerySchema', () => {
  it('defaults boolean filters to false', () => {
    expect(inventoryListQuerySchema.parse({})).toMatchObject({
      lowStock: false,
      includeArchived: false,
      page: 1,
      pageSize: 10,
    });
  });

  it('coerces boolean query strings and native booleans', () => {
    expect(
      inventoryListQuerySchema.parse({ lowStock: 'true', includeArchived: true }),
    ).toMatchObject({ lowStock: true, includeArchived: true });
    expect(inventoryListQuerySchema.parse({ lowStock: 'false' }).lowStock).toBe(false);
  });
});

describe('movementListQuerySchema date range', () => {
  it('accepts an ordered range, a single bound, and equal dates', () => {
    expect(
      movementListQuerySchema.safeParse({ from: '2026-01-01', to: '2026-02-01' }).success,
    ).toBe(true);
    expect(movementListQuerySchema.safeParse({ from: '2026-01-01' }).success).toBe(true);
    expect(
      movementListQuerySchema.safeParse({ from: '2026-01-01', to: '2026-01-01' }).success,
    ).toBe(true);
  });

  it('rejects a reversed range', () => {
    expect(
      movementListQuerySchema.safeParse({ from: '2026-02-01', to: '2026-01-01' }).success,
    ).toBe(false);
  });
});

describe('createMovementSchema', () => {
  const base = { productId: 'prod-1', warehouseId: 'wh-1' };

  it('accepts positive receipt and issue quantities', () => {
    expect(createMovementSchema.parse({ ...base, type: 'RECEIPT', quantity: 5 })).toMatchObject({
      type: 'RECEIPT',
      quantity: 5,
    });
    expect(createMovementSchema.parse({ ...base, type: 'ISSUE', quantity: 5 })).toMatchObject({
      type: 'ISSUE',
      quantity: 5,
    });
  });

  it('allows negative adjustments but rejects zero adjustments', () => {
    expect(createMovementSchema.parse({ ...base, type: 'ADJUSTMENT', quantity: -3 })).toMatchObject(
      {
        type: 'ADJUSTMENT',
        quantity: -3,
      },
    );
    expect(
      createMovementSchema.safeParse({ ...base, type: 'ADJUSTMENT', quantity: 0 }).success,
    ).toBe(false);
  });

  it('rejects zero or negative non-adjustment quantities', () => {
    expect(createMovementSchema.safeParse({ ...base, type: 'RECEIPT', quantity: 0 }).success).toBe(
      false,
    );
    expect(createMovementSchema.safeParse({ ...base, type: 'ISSUE', quantity: -1 }).success).toBe(
      false,
    );
  });

  it('rejects transfer types and fractional quantities', () => {
    expect(
      createMovementSchema.safeParse({ ...base, type: 'TRANSFER_IN', quantity: 1 }).success,
    ).toBe(false);
    expect(
      createMovementSchema.safeParse({ ...base, type: 'TRANSFER_OUT', quantity: 1 }).success,
    ).toBe(false);
    expect(
      createMovementSchema.safeParse({ ...base, type: 'RECEIPT', quantity: 1.5 }).success,
    ).toBe(false);
  });
});

describe('createTransferSchema', () => {
  const base = { productId: 'prod-1', quantity: 5 };

  it('accepts different source and destination warehouses', () => {
    expect(
      createTransferSchema.parse({ ...base, fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2' }),
    ).toMatchObject({ fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', quantity: 5 });
  });

  it('rejects same-warehouse transfers', () => {
    expect(
      createTransferSchema.safeParse({ ...base, fromWarehouseId: 'wh-1', toWarehouseId: 'wh-1' })
        .success,
    ).toBe(false);
  });

  it('requires a positive quantity', () => {
    expect(
      createTransferSchema.safeParse({
        ...base,
        quantity: 0,
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
      }).success,
    ).toBe(false);
    expect(
      createTransferSchema.safeParse({
        ...base,
        quantity: -5,
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
      }).success,
    ).toBe(false);
  });
});
