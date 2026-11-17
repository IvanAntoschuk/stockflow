import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { ListQuery, SupplierInput, SupplierUpdateInput } from './catalog.schemas.js';
import { buildMeta, optionalText } from './catalog.utils.js';

const supplierInclude = {
  _count: { select: { products: true } },
} satisfies Prisma.SupplierInclude;

type SupplierWithCount = Prisma.SupplierGetPayload<{ include: typeof supplierInclude }>;

function serialize(supplier: SupplierWithCount) {
  return {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    notes: supplier.notes,
    productCount: supplier._count.products,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

export async function listSuppliers(query: ListQuery) {
  const search = query.search;
  const where: Prisma.SupplierWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [suppliers, total] = await prisma.$transaction([
    prisma.supplier.findMany({
      where,
      include: supplierInclude,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    items: suppliers.map(serialize),
    meta: buildMeta(query.page, query.pageSize, total),
  };
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: supplierInclude,
  });

  if (!supplier) {
    throw AppError.notFound('Supplier not found');
  }

  return serialize(supplier);
}

export async function createSupplier(input: SupplierInput) {
  const supplier = await prisma.supplier.create({
    data: {
      name: input.name,
      contactName: optionalText(input.contactName),
      email: optionalText(input.email),
      phone: optionalText(input.phone),
      address: optionalText(input.address),
      notes: optionalText(input.notes),
    },
    include: supplierInclude,
  });

  return serialize(supplier);
}

export async function updateSupplier(id: string, input: SupplierUpdateInput) {
  const supplier = await prisma.supplier.findUnique({ where: { id }, select: { id: true } });

  if (!supplier) {
    throw AppError.notFound('Supplier not found');
  }

  const data: Prisma.SupplierUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.contactName !== undefined) data.contactName = optionalText(input.contactName);
  if (input.email !== undefined) data.email = optionalText(input.email);
  if (input.phone !== undefined) data.phone = optionalText(input.phone);
  if (input.address !== undefined) data.address = optionalText(input.address);
  if (input.notes !== undefined) data.notes = optionalText(input.notes);

  const updated = await prisma.supplier.update({
    where: { id },
    data,
    include: supplierInclude,
  });

  return serialize(updated);
}

export async function deleteSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id }, select: { id: true } });

  if (!supplier) {
    throw AppError.notFound('Supplier not found');
  }

  const productCount = await prisma.product.count({ where: { supplierId: id } });
  if (productCount > 0) {
    throw AppError.conflict(
      'SUPPLIER_IN_USE',
      'Remove this supplier from its products before deleting it',
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return { deleted: true };
}
