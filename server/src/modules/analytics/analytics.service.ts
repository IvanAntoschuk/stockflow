import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { buildMeta } from '../catalog/catalog.utils.js';
import { movementTypes } from '../inventory/inventory.schemas.js';
import type {
  AnalyticsLowStockQuery,
  AnalyticsMovementByTypeQuery,
  AnalyticsMovementTrendQuery,
  AnalyticsStockBreakdownQuery,
  AnalyticsSummaryQuery,
} from './analytics.schemas.js';

type MovementType = (typeof movementTypes)[number];
type Granularity = 'day' | 'week' | 'month';

type FilterQuery = {
  productId?: string;
  warehouseId?: string;
  categoryId?: string;
  supplierId?: string;
  from?: Date;
  to?: Date;
  type?: MovementType;
};

const analyticsInventoryInclude = {
  product: {
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      minStock: true,
      isArchived: true,
      costPrice: true,
      sellingPrice: true,
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  },
  warehouse: { select: { id: true, name: true, code: true } },
} satisfies Prisma.InventoryInclude;

type AnalyticsInventoryRow = Prisma.InventoryGetPayload<{
  include: typeof analyticsInventoryInclude;
}>;

type MovementRow = {
  type: MovementType;
  quantity: number;
  createdAt: Date;
};

type MovementStats = Record<MovementType, { count: number; units: number }>;

type TrendBucket = {
  period: Date;
  movementCount: number;
  receipts: number;
  issues: number;
  adjustments: number;
  transfersIn: number;
  transfersOut: number;
  receivedUnits: number;
  issuedUnits: number;
  netUnits: number;
};

const movementLabels: Record<MovementType, string> = {
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  ADJUSTMENT: 'Adjustment',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
};

function toMoney(value: Prisma.Decimal): string {
  return value.toDecimalPlaces(2).toString();
}

function emptyMovementStats(): MovementStats {
  return {
    RECEIPT: { count: 0, units: 0 },
    ISSUE: { count: 0, units: 0 },
    ADJUSTMENT: { count: 0, units: 0 },
    TRANSFER_IN: { count: 0, units: 0 },
    TRANSFER_OUT: { count: 0, units: 0 },
  };
}

function inventoryWhere(query: FilterQuery & { includeArchived?: boolean }): Prisma.InventoryWhereInput {
  const product: Prisma.ProductWhereInput = {
    ...(query.includeArchived ? {} : { isArchived: false }),
    ...(query.productId ? { id: query.productId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
  };

  return {
    product,
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
  };
}

function movementWhere(query: FilterQuery): Prisma.StockMovementWhereInput {
  const product: Prisma.ProductWhereInput = {
    ...(query.productId ? { id: query.productId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
  };

  return {
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(Object.keys(product).length ? { product } : {}),
  };
}

function stockStatus(row: AnalyticsInventoryRow): 'out' | 'low' | 'ok' {
  return row.quantity <= 0
    ? 'out'
    : row.quantity <= row.product.minStock
      ? 'low'
      : 'ok';
}

function truncateDate(value: Date, granularity: Granularity): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);

  if (granularity === 'day') {
    return date;
  }

  if (granularity === 'week') {
    const weekday = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() - ((weekday + 6) % 7));
    return date;
  }

  date.setUTCDate(1);
  return date;
}

function addPeriod(value: Date, granularity: Granularity): Date {
  const date = new Date(value);

  if (granularity === 'day') {
    date.setUTCDate(date.getUTCDate() + 1);
  } else if (granularity === 'week') {
    date.setUTCDate(date.getUTCDate() + 7);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }

  return date;
}

function emptyTrendBucket(period: Date): TrendBucket {
  return {
    period,
    movementCount: 0,
    receipts: 0,
    issues: 0,
    adjustments: 0,
    transfersIn: 0,
    transfersOut: 0,
    receivedUnits: 0,
    issuedUnits: 0,
    netUnits: 0,
  };
}

async function fetchMovementRows(query: FilterQuery): Promise<MovementRow[]> {
  const rows = await prisma.stockMovement.findMany({
    where: movementWhere(query),
    select: { type: true, quantity: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((row) => ({
    type: row.type,
    quantity: row.quantity,
    createdAt: row.createdAt,
  }));
}

export async function getAnalyticsSummary(query: AnalyticsSummaryQuery) {
  const where = movementWhere(query);
  const [products, activeProducts, archivedProducts, categories, suppliers, warehouses, rows, grouped, lastMovement] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isArchived: false } }),
      prisma.product.count({ where: { isArchived: true } }),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.warehouse.count(),
      prisma.inventory.findMany({ where: inventoryWhere(query), include: analyticsInventoryInclude }),
      prisma.stockMovement.groupBy({
        by: ['type'],
        where,
        _count: { _all: true },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    ]);

  let totalUnits = 0;
  let lowStockBalances = 0;
  let outOfStockBalances = 0;
  let valueAtCost = new Prisma.Decimal(0);
  let valueAtSelling = new Prisma.Decimal(0);

  for (const row of rows) {
    totalUnits += row.quantity;
    const status = stockStatus(row);
    if (status === 'low') {
      lowStockBalances += 1;
    } else if (status === 'out') {
      outOfStockBalances += 1;
    }
    valueAtCost = valueAtCost.add(new Prisma.Decimal(row.quantity).mul(row.product.costPrice));
    valueAtSelling = valueAtSelling.add(new Prisma.Decimal(row.quantity).mul(row.product.sellingPrice));
  }

  const stats = emptyMovementStats();
  let netUnits = 0;
  let totalMovements = 0;

  for (const group of grouped) {
    stats[group.type] = {
      count: group._count._all,
      units: group._sum.quantity ?? 0,
    };
    netUnits += group._sum.quantity ?? 0;
    totalMovements += group._count._all;
  }

  return {
    generatedAt: new Date().toISOString(),
    range: {
      from: query.from?.toISOString() ?? null,
      to: query.to?.toISOString() ?? null,
    },
    catalog: {
      products: products,
      activeProducts,
      archivedProducts,
      categories,
      suppliers,
      warehouses,
    },
    stock: {
      totalUnits,
      lowStockBalances,
      outOfStockBalances,
      inventoryValueAtCost: toMoney(valueAtCost),
      inventoryValueAtSelling: toMoney(valueAtSelling),
      potentialMargin: toMoney(valueAtSelling.sub(valueAtCost)),
    },
    movements: {
      total: totalMovements,
      receipts: stats.RECEIPT.count,
      issues: stats.ISSUE.count,
      adjustments: stats.ADJUSTMENT.count,
      transfersIn: stats.TRANSFER_IN.count,
      transfersOut: stats.TRANSFER_OUT.count,
      receivedUnits: stats.RECEIPT.units,
      issuedUnits: stats.ISSUE.units,
      adjustedUnits: stats.ADJUSTMENT.units,
      netUnits,
    },
    lastMovementAt: lastMovement?.createdAt.toISOString() ?? null,
  };
}

export async function getStockBreakdown(query: AnalyticsStockBreakdownQuery) {
  const rows = await prisma.inventory.findMany({
    where: inventoryWhere(query),
    include: analyticsInventoryInclude,
    orderBy: [{ product: { name: 'asc' } }, { warehouse: { name: 'asc' } }],
  });

  const groups = new Map<
    string,
    {
      id: string;
      label: string;
      skus: Set<string>;
      balanceCount: number;
      totalUnits: number;
      lowStockBalances: number;
      outOfStockBalances: number;
      cost: Prisma.Decimal;
      selling: Prisma.Decimal;
    }
  >();

  for (const row of rows) {
    let key: string;
    let label: string;

    if (query.groupBy === 'warehouse') {
      key = row.warehouseId;
      label = row.warehouse.name;
    } else if (query.groupBy === 'supplier') {
      key = row.product.supplier?.id ?? 'unassigned';
      label = row.product.supplier?.name ?? 'Unassigned';
    } else {
      key = row.product.category.id;
      label = row.product.category.name;
    }

    let group = groups.get(key);
    if (!group) {
      group = {
        id: key,
        label,
        skus: new Set<string>(),
        balanceCount: 0,
        totalUnits: 0,
        lowStockBalances: 0,
        outOfStockBalances: 0,
        cost: new Prisma.Decimal(0),
        selling: new Prisma.Decimal(0),
      };
      groups.set(key, group);
    }

    group.skus.add(row.productId);
    group.balanceCount += 1;
    group.totalUnits += row.quantity;
    const status = stockStatus(row);
    if (status === 'low') {
      group.lowStockBalances += 1;
    } else if (status === 'out') {
      group.outOfStockBalances += 1;
    }
    group.cost = group.cost.add(new Prisma.Decimal(row.quantity).mul(row.product.costPrice));
    group.selling = group.selling.add(new Prisma.Decimal(row.quantity).mul(row.product.sellingPrice));
  }

  const result = Array.from(groups.values())
    .map((group) => ({
      id: group.id,
      label: group.label,
      skuCount: group.skus.size,
      balanceCount: group.balanceCount,
      totalUnits: group.totalUnits,
      lowStockBalances: group.lowStockBalances,
      outOfStockBalances: group.outOfStockBalances,
      inventoryValueAtCost: toMoney(group.cost),
      inventoryValueAtSelling: toMoney(group.selling),
    }))
    .sort((a, b) => b.totalUnits - a.totalUnits || a.label.localeCompare(b.label));

  return { groupBy: query.groupBy, rows: result };
}

export async function getLowStockReport(query: AnalyticsLowStockQuery) {
  const rows = await prisma.inventory.findMany({
    where: inventoryWhere(query),
    include: analyticsInventoryInclude,
    orderBy: [{ product: { name: 'asc' } }, { warehouse: { name: 'asc' } }],
  });

  const search = query.search?.trim().toLowerCase();
  const items = rows
    .map((row) => {
      const status = stockStatus(row);
      const shortfall = Math.max(0, row.product.minStock - row.quantity);
      return {
        product: {
          id: row.product.id,
          sku: row.product.sku,
          name: row.product.name,
          unit: row.product.unit,
          category: row.product.category,
        },
        warehouse: row.warehouse,
        quantity: row.quantity,
        minStock: row.product.minStock,
        shortfall,
        status,
        stockValueAtCost: toMoney(new Prisma.Decimal(row.quantity).mul(row.product.costPrice)),
      };
    })
    .filter((item) => item.status === 'out' || item.status === 'low')
    .filter((item) => !query.status || item.status === query.status)
    .filter((item) => {
      if (!search) {
        return true;
      }
      return [
        item.product.name,
        item.product.sku,
        item.product.category.name,
        item.warehouse.name,
        item.warehouse.code,
      ].some((value) => value.toLowerCase().includes(search));
    })
    .sort(
      (a, b) =>
        Number(a.status === 'out') - Number(b.status === 'out') ||
        b.shortfall - a.shortfall ||
        a.product.name.localeCompare(b.product.name),
    );

  const total = items.length;
  const pageItems = items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);

  return { items: pageItems, meta: buildMeta(query.page, query.pageSize, total) };
}

export async function getMovementTrend(query: AnalyticsMovementTrendQuery) {
  const rows = await fetchMovementRows(query);
  const granularity = query.granularity;
  const firstDate = query.from ?? rows[0]?.createdAt;
  const lastDate = query.to ?? rows[rows.length - 1]?.createdAt;
  const periods: Date[] = [];

  if (firstDate && lastDate) {
    let cursor = truncateDate(firstDate, granularity);
    const end = truncateDate(lastDate, granularity);
    while (cursor <= end && periods.length < 200) {
      periods.push(cursor);
      cursor = addPeriod(cursor, granularity);
    }
  }

  const buckets = new Map<string, TrendBucket>();
  for (const period of periods) {
    buckets.set(period.toISOString(), emptyTrendBucket(period));
  }

  for (const row of rows) {
    const period = truncateDate(row.createdAt, granularity);
    const key = period.toISOString();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = emptyTrendBucket(period);
      buckets.set(key, bucket);
    }

    bucket.movementCount += 1;
    bucket.netUnits += row.quantity;

    if (row.type === 'RECEIPT') {
      bucket.receipts += 1;
      bucket.receivedUnits += row.quantity;
    } else if (row.type === 'ISSUE') {
      bucket.issues += 1;
      bucket.issuedUnits += Math.abs(row.quantity);
    } else if (row.type === 'ADJUSTMENT') {
      bucket.adjustments += 1;
    } else if (row.type === 'TRANSFER_IN') {
      bucket.transfersIn += 1;
    } else {
      bucket.transfersOut += 1;
    }
  }

  const series = Array.from(buckets.values())
    .sort((a, b) => a.period.getTime() - b.period.getTime())
    .map((bucket) => ({
      period: bucket.period.toISOString(),
      movementCount: bucket.movementCount,
      receipts: bucket.receipts,
      issues: bucket.issues,
      adjustments: bucket.adjustments,
      transfersIn: bucket.transfersIn,
      transfersOut: bucket.transfersOut,
      receivedUnits: bucket.receivedUnits,
      issuedUnits: bucket.issuedUnits,
      netUnits: bucket.netUnits,
    }));

  return {
    granularity,
    range: {
      from: query.from?.toISOString() ?? null,
      to: query.to?.toISOString() ?? null,
    },
    series,
  };
}

export async function getMovementByType(query: AnalyticsMovementByTypeQuery) {
  const rows = await fetchMovementRows(query);
  const stats = emptyMovementStats();

  for (const row of rows) {
    stats[row.type].count += 1;
    stats[row.type].units += Math.abs(row.quantity);
  }

  return {
    range: {
      from: query.from?.toISOString() ?? null,
      to: query.to?.toISOString() ?? null,
    },
    rows: movementTypes.map((type) => ({
      type,
      label: movementLabels[type],
      count: stats[type].count,
      units: stats[type].units,
    })),
  };
}
