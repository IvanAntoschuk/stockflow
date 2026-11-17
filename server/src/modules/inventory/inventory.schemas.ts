import { z } from 'zod';

const id = z.string().trim().min(1, 'A valid identifier is required');
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const movementTypes = [
  'RECEIPT',
  'ISSUE',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
] as const;

export const movementTypeSchema = z.enum(movementTypes);

export const idParamSchema = z.object({ id });

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  productId: z.string().trim().min(1).optional(),
  warehouseId: z.string().trim().min(1).optional(),
  lowStock: z.preprocess((value) => value === true || value === 'true', z.boolean()).default(false),
  includeArchived: z.preprocess(
    (value) => value === true || value === 'true',
    z.boolean(),
  ).default(false),
});

export const movementListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    productId: z.string().trim().min(1).optional(),
    warehouseId: z.string().trim().min(1).optional(),
    type: movementTypeSchema.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ['to'],
    message: 'The end date must be after the start date',
  });

export const createMovementSchema = z
  .object({
    productId: id,
    warehouseId: id,
    type: z.enum(['RECEIPT', 'ISSUE', 'ADJUSTMENT']),
    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .min(-1_000_000_000, 'Quantity is too small')
      .max(1_000_000_000, 'Quantity is too large'),
    reference: optionalText(80),
    note: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'ADJUSTMENT' && value.quantity === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Adjustment cannot be zero',
      });
    }

    if (value.type !== 'ADJUSTMENT' && value.quantity <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Quantity must be greater than zero',
      });
    }
  });

export const createTransferSchema = z
  .object({
    productId: id,
    fromWarehouseId: id,
    toWarehouseId: id,
    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be greater than zero')
      .max(1_000_000_000, 'Quantity is too large'),
    reference: optionalText(80),
    note: optionalText(500),
  })
  .refine((value) => value.fromWarehouseId !== value.toWarehouseId, {
    path: ['toWarehouseId'],
    message: 'Source and destination warehouses must be different',
  });

export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
export type MovementListQuery = z.infer<typeof movementListQuerySchema>;
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
