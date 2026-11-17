import { z } from 'zod';

const email = z
  .string()
  .trim()
  .max(254)
  .optional()
  .refine(
    (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Enter a valid email address',
  );

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(80, 'Category name must be at most 80 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
});

export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Supplier name is required')
    .max(120, 'Supplier name must be at most 120 characters'),
  contactName: z.string().trim().max(120, 'Contact name is too long').optional(),
  email,
  phone: z.string().trim().max(40, 'Phone number is too long').optional(),
  address: z.string().trim().max(300, 'Address is too long').optional(),
  notes: z.string().trim().max(1000, 'Notes are too long').optional(),
});

export const warehouseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Warehouse name is required')
    .max(120, 'Warehouse name must be at most 120 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Warehouse code is required')
    .max(20, 'Warehouse code must be at most 20 characters'),
  city: z.string().trim().max(120, 'City is too long').optional(),
  address: z.string().trim().max(300, 'Address is too long').optional(),
});

export const productFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(40, 'SKU must be at most 40 characters'),
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(160, 'Product name must be at most 160 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  categoryId: z.string().min(1, 'Select a category'),
  supplierId: z.string().optional(),
  unit: z.string().trim().min(1, 'Unit is required').max(20, 'Unit is too long'),
  costPrice: z
    .number()
    .min(0, 'Cost price cannot be negative')
    .max(9_999_999_999.99, 'Cost price is too large'),
  sellingPrice: z
    .number()
    .min(0, 'Selling price cannot be negative')
    .max(9_999_999_999.99, 'Selling price is too large'),
  minStock: z
    .number()
    .int('Minimum stock must be a whole number')
    .min(0, 'Minimum stock cannot be negative')
    .max(1_000_000_000, 'Minimum stock is too large'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
