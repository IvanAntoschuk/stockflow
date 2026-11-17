import { describe, expect, it } from 'vitest';
import {
  createCategorySchema,
  createProductSchema,
  createSupplierSchema,
  createWarehouseSchema,
  idParamSchema,
  paginationQuerySchema,
  productListQuerySchema,
  updateCategorySchema,
  updateProductSchema,
  updateSupplierSchema,
  updateWarehouseSchema,
} from '../src/modules/catalog/catalog.schemas.js';

describe('paginationQuerySchema', () => {
  it('applies defaults for missing values', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it('coerces numeric strings and trims search text', () => {
    expect(
      paginationQuerySchema.parse({ page: '2', pageSize: '25', search: '  widget  ' }),
    ).toEqual({ page: 2, pageSize: 25, search: 'widget' });
  });

  it('rejects out-of-range, fractional and non-numeric pagination values', () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: 1.5 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('requires a non-empty identifier', () => {
    expect(idParamSchema.parse({ id: '  abc  ' })).toEqual({ id: 'abc' });
    expect(idParamSchema.safeParse({ id: '' }).success).toBe(false);
  });
});

describe('category schemas', () => {
  it('trims the name and accepts a nullable description', () => {
    expect(createCategorySchema.parse({ name: '  Tools  ' })).toEqual({
      name: 'Tools',
      description: undefined,
    });
    expect(createCategorySchema.parse({ name: 'Tools', description: null })).toEqual({
      name: 'Tools',
      description: null,
    });
  });

  it('rejects an empty name', () => {
    expect(createCategorySchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('allows partial updates but requires at least one field', () => {
    expect(updateCategorySchema.parse({ description: 'Updated' })).toEqual({
      description: 'Updated',
    });
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });
});

describe('supplier schemas', () => {
  it('accepts nullable optional fields and a valid email', () => {
    const parsed = createSupplierSchema.parse({
      name: 'Acme',
      contactName: null,
      email: 'buyer@acme.test',
      phone: null,
      address: null,
      notes: null,
    });
    expect(parsed).toMatchObject({
      name: 'Acme',
      contactName: null,
      email: 'buyer@acme.test',
      phone: null,
      address: null,
      notes: null,
    });
  });

  it('rejects a malformed email', () => {
    expect(createSupplierSchema.safeParse({ name: 'Acme', email: 'not-an-email' }).success).toBe(
      false,
    );
  });

  it('allows partial updates but requires at least one field', () => {
    expect(updateSupplierSchema.parse({ phone: '555-0100' })).toEqual({ phone: '555-0100' });
    expect(updateSupplierSchema.safeParse({}).success).toBe(false);
  });
});

describe('warehouse schemas', () => {
  it('requires name and code and accepts nullable address fields', () => {
    expect(createWarehouseSchema.parse({ name: 'Main', code: 'MAIN' })).toEqual({
      name: 'Main',
      code: 'MAIN',
      address: undefined,
      city: undefined,
    });
    expect(createWarehouseSchema.parse({ name: 'Main', code: 'MAIN', city: null })).toMatchObject({
      city: null,
    });
  });

  it('rejects a missing code and allows partial updates only with a field', () => {
    expect(createWarehouseSchema.safeParse({ name: 'Main' }).success).toBe(false);
    expect(updateWarehouseSchema.parse({ city: 'Kyiv' })).toEqual({ city: 'Kyiv' });
    expect(updateWarehouseSchema.safeParse({}).success).toBe(false);
  });
});

describe('product schemas', () => {
  const validProduct = {
    sku: 'SKU-1',
    name: 'Widget',
    categoryId: 'cat-1',
    costPrice: 10,
    sellingPrice: 20,
  };

  it('defaults unit and minStock on create', () => {
    expect(createProductSchema.parse(validProduct)).toMatchObject({
      sku: 'SKU-1',
      name: 'Widget',
      categoryId: 'cat-1',
      unit: 'pcs',
      minStock: 0,
      costPrice: 10,
      sellingPrice: 20,
    });
  });

  it('accepts nullable supplierId and description', () => {
    expect(
      createProductSchema.parse({ ...validProduct, supplierId: null, description: null }),
    ).toMatchObject({ supplierId: null, description: null });
  });

  it('requires categoryId', () => {
    const { categoryId: _categoryId, ...withoutCategory } = validProduct;
    expect(createProductSchema.safeParse(withoutCategory).success).toBe(false);
    expect(createProductSchema.safeParse({ ...validProduct, categoryId: '' }).success).toBe(false);
  });

  it('rejects negative prices and minimum stock', () => {
    expect(createProductSchema.safeParse({ ...validProduct, costPrice: -1 }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...validProduct, sellingPrice: -1 }).success).toBe(
      false,
    );
    expect(createProductSchema.safeParse({ ...validProduct, minStock: -1 }).success).toBe(false);
  });

  it('allows partial updates but requires at least one field', () => {
    expect(updateProductSchema.parse({ minStock: 5 })).toEqual({ minStock: 5 });
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });
});

describe('productListQuerySchema', () => {
  it('defaults includeArchived to false and coerces boolean query strings', () => {
    expect(productListQuerySchema.parse({}).includeArchived).toBe(false);
    expect(productListQuerySchema.parse({ includeArchived: 'true' }).includeArchived).toBe(true);
    expect(productListQuerySchema.parse({ includeArchived: true }).includeArchived).toBe(true);
    expect(productListQuerySchema.parse({ includeArchived: 'false' }).includeArchived).toBe(false);
  });
});
