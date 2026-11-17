import { randomUUID } from 'node:crypto';
import { Prisma, type StockMovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import { buildMeta, optionalText } from '../catalog/catalog.utils.js';
import type {
  CreateMovementInput,
  CreateTransferInput,
  MovementListQuery,
} from './inventory.schemas.js';

const movementInclude = {
  product: { select: { id: true, sku: true, name: true, unit: true } },
  warehouse: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.StockMovementInclude;

type MovementRecord = Prisma.StockMovementGetPayload<{ include: typeof movementInclude }>;
type InventoryRow = { id: string; quantity: number };

function serialize(movement: MovementRecord) {
  return {
    id: movement.id,
    productId: movement.productId,
    product: movement.product,
    warehouseId: movement.warehouseId,
    warehouse: movement.warehouse,
    userId: movement.userId,
    user: movement.user,
    type: movement.type,
    quantity: movement.quantity,
    previousQuantity: movement.previousQuantity,
    newQuantity: movement.newQuantity,
    reference: movement.reference,
    note: movement.note,
    createdAt: movement.createdAt,
  };
}

async function lockProduct(tx: Prisma.TransactionClient, productId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string; isArchived: boolean }>>`
    SELECT id, "isArchived" FROM "Product" WHERE id = ${productId} FOR UPDATE
  `;
  const product = rows[0];

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  if (product.isArchived) {
    throw AppError.conflict(
      'PRODUCT_ARCHIVED',
      'Archived products cannot receive stock movements',
    );
  }

  return product;
}

async function ensureWarehouse(tx: Prisma.TransactionClient, warehouseId: string) {
  const warehouse = await tx.warehouse.findUnique({
    where: { id: warehouseId },
    select: { id: true },
  });

  if (!warehouse) {
    throw AppError.badRequest('The selected warehouse does not exist');
  }
}

async function ensureInventoryRow(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
): Promise<InventoryRow> {
  return tx.inventory.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    update: {},
    create: { productId, warehouseId, quantity: 0 },
    select: { id: true, quantity: true },
  });
}

interface RecordDeltaInput {
  row: InventoryRow;
  productId: string;
  warehouseId: string;
  userId: string;
  type: StockMovementType;
  delta: number;
  reference: string | null;
  note: string | null;
}

async function recordDelta(tx: Prisma.TransactionClient, input: RecordDeltaInput) {
  const newQuantity = input.row.quantity + input.delta;

  if (newQuantity < 0) {
    throw AppError.conflict(
      'INSUFFICIENT_STOCK',
      'There is not enough stock in this warehouse for this movement',
    );
  }

  await tx.inventory.update({
    where: { id: input.row.id },
    data: { quantity: newQuantity },
  });

  const movement = await tx.stockMovement.create({
    data: {
      productId: input.productId,
      warehouseId: input.warehouseId,
      userId: input.userId,
      type: input.type,
      quantity: input.delta,
      previousQuantity: input.row.quantity,
      newQuantity,
      reference: input.reference,
      note: input.note,
    },
    include: movementInclude,
  });

  return serialize(movement);
}

export async function listMovements(query: MovementListQuery) {
  const search = query.search;
  const where: Prisma.StockMovementWhereInput = {
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' } } },
            { product: { sku: { contains: search, mode: 'insensitive' } } },
            { warehouse: { name: { contains: search, mode: 'insensitive' } } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { reference: { contains: search, mode: 'insensitive' } },
            { note: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      include: movementInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    items: movements.map(serialize),
    meta: buildMeta(query.page, query.pageSize, total),
  };
}

export async function getMovement(id: string) {
  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: movementInclude,
  });

  if (!movement) {
    throw AppError.notFound('Stock movement not found');
  }

  return serialize(movement);
}

export async function createMovement(input: CreateMovementInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    await lockProduct(tx, input.productId);
    await ensureWarehouse(tx, input.warehouseId);
    const row = await ensureInventoryRow(tx, input.productId, input.warehouseId);

    return recordDelta(tx, {
      row,
      productId: input.productId,
      warehouseId: input.warehouseId,
      userId,
      type: input.type,
      delta: input.type === 'ISSUE' ? -input.quantity : input.quantity,
      reference: optionalText(input.reference),
      note: optionalText(input.note),
    });
  });
}

export async function createTransfer(input: CreateTransferInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    await lockProduct(tx, input.productId);
    await ensureWarehouse(tx, input.fromWarehouseId);
    await ensureWarehouse(tx, input.toWarehouseId);

    const reference = optionalText(input.reference) ?? `TR-${randomUUID()}`;
    const note = optionalText(input.note);
    const outboundRow = await ensureInventoryRow(tx, input.productId, input.fromWarehouseId);

    const outbound = await recordDelta(tx, {
      row: outboundRow,
      productId: input.productId,
      warehouseId: input.fromWarehouseId,
      userId,
      type: 'TRANSFER_OUT',
      delta: -input.quantity,
      reference,
      note,
    });

    const inboundRow = await ensureInventoryRow(tx, input.productId, input.toWarehouseId);

    const inbound = await recordDelta(tx, {
      row: inboundRow,
      productId: input.productId,
      warehouseId: input.toWarehouseId,
      userId,
      type: 'TRANSFER_IN',
      delta: input.quantity,
      reference,
      note,
    });

    return { outbound, inbound, reference };
  });
}
