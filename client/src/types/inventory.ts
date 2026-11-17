import type { ListParams } from './catalog';

export const stockMovementTypes = [
  'RECEIPT',
  'ISSUE',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
] as const;

export type StockMovementType = (typeof stockMovementTypes)[number];

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  minStock: number;
  isArchived: boolean;
  category: { id: string; name: string };
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: InventoryProduct;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  quantity: number;
  status: 'out' | 'low' | 'ok';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: { id: string; sku: string; name: string; unit: string };
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  userId: string;
  user: { id: string; name: string };
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface InventoryListParams extends ListParams {
  productId?: string;
  warehouseId?: string;
  lowStock?: boolean;
  includeArchived?: boolean;
}

export interface MovementListParams extends ListParams {
  productId?: string;
  warehouseId?: string;
  type?: StockMovementType;
  from?: string;
  to?: string;
}

export interface MovementPayload {
  productId: string;
  warehouseId: string;
  type: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT';
  quantity: number;
  reference?: string | null;
  note?: string | null;
}

export interface TransferPayload {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reference?: string | null;
  note?: string | null;
}

export interface TransferResult {
  outbound: StockMovement;
  inbound: StockMovement;
  reference: string;
}
