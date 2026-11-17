import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type {
  ProductInput,
  ProductListQuery,
  ProductUpdateInput,
} from './catalog.schemas.js';
import { buildMeta, optionalText } from './catalog.utils.js';

const productInclude = {
  category: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
  inventory: {
    select: {
      id: true,
      warehouseId: true,
      quantity: true,
      warehouse: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function serialize(product: ProductRecord) {
  const { inventory, ...rest } = product;
  return {
    ...rest,
    costPrice: product.costPrice.toString(),
    sellingPrice: product.sellingPrice.toString(),
    stock: inventory.reduce((total, row) => total + row.quantity, 0),
    inventory,
  };
}

async function ensureCategory(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw AppError.badRequest('The selected category does not exist');
  }
}

async function ensureSupplier(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true },
  });

  if (!supplier) {
    throw AppError.badRequest('The selected supplier does not exist');
  }
}

export async function listProducts(query: ProductListQuery) {
  const search = query.search;
  const where: Prisma.ProductWhereInput = {
    ...(query.includeArchived ? {} : { isArchived: false }),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
            { supplier: { is: { name: { contains: search, mode: 'insensitive' } } } },
            {
              inventory: {
                some: {
                  warehouse: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map(serialize),
    meta: buildMeta(query.page, query.pageSize, total),
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return serialize(product);
}

export async function createProduct(input: ProductInput) {
  const sku = input.sku.toUpperCase();
  const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } });

  if (existing) {
    throw AppError.conflict('SKU_IN_USE', 'A product with this SKU already exists');
  }

  await ensureCategory(input.categoryId);
  if (input.supplierId) {
    await ensureSupplier(input.supplierId);
  }

  const product = await prisma.product.create({
    data: {
      sku,
      name: input.name,
      description: optionalText(input.description),
      categoryId: input.categoryId,
      supplierId: input.supplierId ?? null,
      unit: input.unit,
      costPrice: new Prisma.Decimal(input.costPrice).toDecimalPlaces(2),
      sellingPrice: new Prisma.Decimal(input.sellingPrice).toDecimalPlaces(2),
      minStock: input.minStock,
      isArchived: input.isArchived ?? false,
    },
    include: productInclude,
  });

  return serialize(product);
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  if (input.sku !== undefined) {
    const sku = input.sku.toUpperCase();
    const duplicate = await prisma.product.findFirst({
      where: { sku, id: { not: id } },
      select: { id: true },
    });

    if (duplicate) {
      throw AppError.conflict('SKU_IN_USE', 'A product with this SKU already exists');
    }
  }

  if (input.categoryId !== undefined) {
    await ensureCategory(input.categoryId);
  }

  if (input.supplierId) {
    await ensureSupplier(input.supplierId);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.sku !== undefined) data.sku = input.sku.toUpperCase();
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = optionalText(input.description);
  if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
  if (input.supplierId !== undefined) {
    data.supplier = input.supplierId ? { connect: { id: input.supplierId } } : { disconnect: true };
  }
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.costPrice !== undefined) {
    data.costPrice = new Prisma.Decimal(input.costPrice).toDecimalPlaces(2);
  }
  if (input.sellingPrice !== undefined) {
    data.sellingPrice = new Prisma.Decimal(input.sellingPrice).toDecimalPlaces(2);
  }
  if (input.minStock !== undefined) data.minStock = input.minStock;
  if (input.isArchived !== undefined) data.isArchived = input.isArchived;

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });

  return serialize(updated);
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { inventory: { select: { quantity: true } } },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  if (product.inventory.some((row) => row.quantity !== 0)) {
    const archived = await prisma.product.update({
      where: { id },
      data: { isArchived: true },
      include: productInclude,
    });

    return { archived: true, deleted: false, product: serialize(archived) };
  }

  await prisma.$transaction([
    prisma.inventory.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  return { archived: false, deleted: true, product: null };
}
