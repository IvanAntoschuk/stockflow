import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { CategoryInput, CategoryUpdateInput, ListQuery } from './catalog.schemas.js';
import { buildMeta, optionalText } from './catalog.utils.js';

const categoryInclude = {
  _count: { select: { products: true } },
} satisfies Prisma.CategoryInclude;

type CategoryWithCount = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;

function serialize(category: CategoryWithCount) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    productCount: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function listCategories(query: ListQuery) {
  const search = query.search;
  const where: Prisma.CategoryWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      include: categoryInclude,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    items: categories.map(serialize),
    meta: buildMeta(query.page, query.pageSize, total),
  };
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: categoryInclude,
  });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  return serialize(category);
}

export async function createCategory(input: CategoryInput) {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: input.name, mode: 'insensitive' } },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict('CATEGORY_NAME_IN_USE', 'A category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: input.name,
      description: optionalText(input.description),
    },
    include: categoryInclude,
  });

  return serialize(category);
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (input.name !== undefined) {
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: { equals: input.name, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw AppError.conflict('CATEGORY_NAME_IN_USE', 'A category with this name already exists');
    }
  }

  const data: Prisma.CategoryUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = optionalText(input.description);

  const updated = await prisma.category.update({
    where: { id },
    data,
    include: categoryInclude,
  });

  return serialize(updated);
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw AppError.conflict(
      'CATEGORY_IN_USE',
      'Move or delete the products in this category before deleting it',
    );
  }

  await prisma.category.delete({ where: { id } });
  return { deleted: true };
}
