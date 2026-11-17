import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { buildMeta } from '../catalog/catalog.utils.js';
import type { InventoryListQuery } from './inventory.schemas.js';

const inventoryInclude = {
  product: {
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      minStock: true,
      isArchived: true,
      category: { select: { id: true, name: true } },
    },
  },
  warehouse: { select: { id: true, name: true, code: true } },
} satisfies Prisma.InventoryInclude;

type InventoryRecord = Prisma.InventoryGetPayload<{ include: typeof inventoryInclude }>;

function serialize(row: InventoryRecord) {
  const status = row.quantity <= 0 ? 'out' : row.quantity <= row.product.minStock ? 'low' : 'ok';

  return {
    id: row.id,
    productId: row.productId,
    product: row.product,
    warehouseId: row.warehouseId,
    warehouse: row.warehouse,
    quantity: row.quantity,
    status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listInventory(query: InventoryListQuery) {
  const lowStockRows = query.lowStock
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT i.id
        FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        WHERE i.quantity <= p."minStock"
      `
    : null;

  const search = query.search;
  const where: Prisma.InventoryWhereInput = {
    ...(query.includeArchived ? {} : { product: { isArchived: false } }),
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(lowStockRows ? { id: { in: lowStockRows.map((row) => row.id) } } : {}),
    ...(search
      ? {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' } } },
            { product: { sku: { contains: search, mode: 'insensitive' } } },
            { product: { category: { name: { contains: search, mode: 'insensitive' } } } },
            { warehouse: { name: { contains: search, mode: 'insensitive' } } },
            { warehouse: { code: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.inventory.findMany({
      where,
      include: inventoryInclude,
      orderBy: [{ product: { name: 'asc' } }, { warehouse: { name: 'asc' } }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.inventory.count({ where }),
  ]);

  return {
    items: rows.map(serialize),
    meta: buildMeta(query.page, query.pageSize, total),
  };
}
