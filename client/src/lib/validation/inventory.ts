import { z } from 'zod';

export const movementFormSchema = z
  .object({
    productId: z.string().min(1, 'Select a product'),
    warehouseId: z.string().min(1, 'Select a warehouse'),
    type: z.enum(['RECEIPT', 'ISSUE', 'ADJUSTMENT']),
    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .min(-1_000_000_000, 'Quantity is too small')
      .max(1_000_000_000, 'Quantity is too large'),
    reference: z.string().trim().max(80, 'Reference is too long').optional(),
    note: z.string().trim().max(500, 'Notes are too long').optional(),
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

export const transferFormSchema = z
  .object({
    productId: z.string().min(1, 'Select a product'),
    fromWarehouseId: z.string().min(1, 'Select a source warehouse'),
    toWarehouseId: z.string().min(1, 'Select a destination warehouse'),
    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be greater than zero')
      .max(1_000_000_000, 'Quantity is too large'),
    reference: z.string().trim().max(80, 'Reference is too long').optional(),
    note: z.string().trim().max(500, 'Notes are too long').optional(),
  })
  .refine((value) => value.fromWarehouseId !== value.toWarehouseId, {
    path: ['toWarehouseId'],
    message: 'Source and destination warehouses must be different',
  });

export type MovementFormValues = z.infer<typeof movementFormSchema>;
export type TransferFormValues = z.infer<typeof transferFormSchema>;
