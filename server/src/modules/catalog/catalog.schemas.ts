import { z } from 'zod';

const id = z.string().trim().min(1, 'A valid identifier is required');
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const idParamSchema = z.object({ id });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
});

const categoryFields = {
  name: z.string().trim().min(1, 'Category name is required').max(80),
  description: optionalText(500),
};

export const createCategorySchema = z.object(categoryFields);
export const updateCategorySchema = z
  .object(categoryFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const email = z
  .string()
  .trim()
  .max(254)
  .nullable()
  .optional()
  .refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Enter a valid email address',
  );

const supplierFields = {
  name: z.string().trim().min(1, 'Supplier name is required').max(120),
  contactName: optionalText(120),
  email,
  phone: optionalText(40),
  address: optionalText(300),
  notes: optionalText(1000),
};

export const createSupplierSchema = z.object(supplierFields);
export const updateSupplierSchema = z
  .object(supplierFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const warehouseFields = {
  name: z.string().trim().min(1, 'Warehouse name is required').max(120),
  code: z.string().trim().min(1, 'Warehouse code is required').max(20),
  address: optionalText(300),
  city: optionalText(120),
};

export const createWarehouseSchema = z.object(warehouseFields);
export const updateWarehouseSchema = z
  .object(warehouseFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const money = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(9_999_999_999.99, 'Price is too large');

const productFields = {
  sku: z.string().trim().min(1, 'SKU is required').max(40),
  name: z.string().trim().min(1, 'Product name is required').max(160),
  description: optionalText(1000),
  categoryId: z.string().trim().min(1, 'Select a category'),
  supplierId: z.string().trim().min(1).nullable().optional(),
  unit: z.string().trim().min(1, 'Unit is required').max(20),
  costPrice: money,
  sellingPrice: money,
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative').max(1_000_000_000),
  isArchived: z.boolean().optional(),
};

export const createProductSchema = z.object({
  ...productFields,
  unit: productFields.unit.default('pcs'),
  minStock: productFields.minStock.default(0),
});

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const productListQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().trim().min(1).optional(),
  supplierId: z.string().trim().min(1).optional(),
  includeArchived: z.preprocess(
    (value) => value === true || value === 'true',
    z.boolean(),
  ).default(false),
});

export type CategoryInput = z.infer<typeof createCategorySchema>;
export type CategoryUpdateInput = z.infer<typeof updateCategorySchema>;
export type SupplierInput = z.infer<typeof createSupplierSchema>;
export type SupplierUpdateInput = z.infer<typeof updateSupplierSchema>;
export type WarehouseInput = z.infer<typeof createWarehouseSchema>;
export type WarehouseUpdateInput = z.infer<typeof updateWarehouseSchema>;
export type ProductInput = z.infer<typeof createProductSchema>;
export type ProductUpdateInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ListQuery = z.infer<typeof paginationQuerySchema>;
