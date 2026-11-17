import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { ListQuery, WarehouseInput, WarehouseUpdateInput } from './catalog.schemas.js';
import { buildMeta, optionalText } from './catalog.utils.js';

const warehouseInclude = {
  _count: { select: { inventory: true } },
} satisfies Prisma.WarehouseInclude;

type WarehouseWithCount = Prisma.WarehouseGetPayload<{ include: typeof warehouseInclude }>;

function serialize(warehouse: WarehouseWithCount) {
  return {
    id: warehouse.id,
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    city: warehouse.city,
    inventoryCount: warehouse._count.inventory,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
  };
}

export async function listWarehouses(query: ListQuery) {
  const search = query.search;
  const where: Prisma.WarehouseWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [warehouses, total] = await prisma.$transaction([
    prisma.warehouse.findMany({
      where,
      include: warehouseInclude,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.warehouse.count({ where }),
  ]);

  return {
    items: warehouses.map(serialize),
    meta: buildMeta(query.page, query.pageSize, total),
  };
}

export async function getWarehouse(id: string) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: warehouseInclude,
  });

  if (!warehouse) {
    throw AppError.notFound('Warehouse not found');
  }

  return serialize(warehouse);
}

export async function createWarehouse(input: WarehouseInput) {
  const code = input.code.toUpperCase();
  const existing = await prisma.warehouse.findFirst({
    where: {
      OR: [
        { code },
        { name: { equals: input.name, mode: 'insensitive' } },
      ],
    },
    select: { code: true, name: true },
  });

  if (existing?.code === code) {
    throw AppError.conflict('WAREHOUSE_CODE_IN_USE', 'A warehouse with this code already exists');
  }

  if (existing) {
    throw AppError.conflict('WAREHOUSE_NAME_IN_USE', 'A warehouse with this name already exists');
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name: input.name,
      code,
      address: optionalText(input.address),
      city: optionalText(input.city),
    },
    include: warehouseInclude,
  });

  return serialize(warehouse);
}

export async function updateWarehouse(id: string, input: WarehouseUpdateInput) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id }, select: { id: true } });

  if (!warehouse) {
    throw AppError.notFound('Warehouse not found');
  }

  const code = input.code?.toUpperCase();

  if (input.name !== undefined || code !== undefined) {
    const duplicate = await prisma.warehouse.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(code ? [{ code }] : []),
          ...(input.name ? [{ name: { equals: input.name, mode: 'insensitive' as const } }] : []),
        ],
      },
      select: { code: true, name: true },
    });

    if (duplicate?.code === code) {
      throw AppError.conflict(
        'WAREHOUSE_CODE_IN_USE',
        'A warehouse with this code already exists',
      );
    }

    if (duplicate) {
      throw AppError.conflict(
        'WAREHOUSE_NAME_IN_USE',
        'A warehouse with this name already exists',
      );
    }
  }

  const data: Prisma.WarehouseUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (code !== undefined) data.code = code;
  if (input.address !== undefined) data.address = optionalText(input.address);
  if (input.city !== undefined) data.city = optionalText(input.city);

  const updated = await prisma.warehouse.update({
    where: { id },
    data,
    include: warehouseInclude,
  });

  return serialize(updated);
}

export async function deleteWarehouse(id: string) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id }, select: { id: true } });

  if (!warehouse) {
    throw AppError.notFound('Warehouse not found');
  }

  const [inventoryCount, movementCount] = await Promise.all([
    prisma.inventory.count({ where: { warehouseId: id } }),
    prisma.stockMovement.count({ where: { warehouseId: id } }),
  ]);
  if (inventoryCount > 0 || movementCount > 0) {
    throw AppError.conflict(
      'WAREHOUSE_IN_USE',
      'This warehouse still has inventory records or stock movements and cannot be deleted',
    );
  }

  await prisma.warehouse.delete({ where: { id } });
  return { deleted: true };
}
