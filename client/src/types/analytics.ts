import type { ListParams } from './catalog';
import type { StockMovementType } from './inventory';

export interface AnalyticsParams extends ListParams {
  productId?: string;
  warehouseId?: string;
  categoryId?: string;
  supplierId?: string;
  from?: string;
  to?: string;
  type?: StockMovementType;
}

export interface AnalyticsSummary {
  generatedAt: string;
  range: { from: string | null; to: string | null };
  catalog: {
    products: number;
    activeProducts: number;
    archivedProducts: number;
    categories: number;
    suppliers: number;
    warehouses: number;
  };
  stock: {
    totalUnits: number;
    lowStockBalances: number;
    outOfStockBalances: number;
    inventoryValueAtCost: string;
    inventoryValueAtSelling: string;
    potentialMargin: string;
  };
  movements: {
    total: number;
    receipts: number;
    issues: number;
    adjustments: number;
    transfersIn: number;
    transfersOut: number;
    receivedUnits: number;
    issuedUnits: number;
    adjustedUnits: number;
    netUnits: number;
  };
  lastMovementAt: string | null;
}

export interface StockBreakdownRow {
  id: string;
  label: string;
  skuCount: number;
  balanceCount: number;
  totalUnits: number;
  lowStockBalances: number;
  outOfStockBalances: number;
  inventoryValueAtCost: string;
  inventoryValueAtSelling: string;
}

export interface StockBreakdown {
  groupBy: 'category' | 'supplier' | 'warehouse';
  rows: StockBreakdownRow[];
}

export interface LowStockRow {
  product: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    category: { id: string; name: string };
  };
  warehouse: { id: string; name: string; code: string };
  quantity: number;
  minStock: number;
  shortfall: number;
  status: 'out' | 'low';
  stockValueAtCost: string;
}

export interface MovementTrendPoint {
  period: string;
  movementCount: number;
  receipts: number;
  issues: number;
  adjustments: number;
  transfersIn: number;
  transfersOut: number;
  receivedUnits: number;
  issuedUnits: number;
  netUnits: number;
}

export interface MovementTrend {
  granularity: 'day' | 'week' | 'month';
  range: { from: string | null; to: string | null };
  series: MovementTrendPoint[];
}

export interface MovementByTypeRow {
  type: StockMovementType;
  label: string;
  count: number;
  units: number;
}

export interface MovementByType {
  range: { from: string | null; to: string | null };
  rows: MovementByTypeRow[];
}
