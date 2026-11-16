import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import {
  createCategorySchema,
  idParamSchema,
  paginationQuerySchema,
  updateCategorySchema,
} from './catalog.schemas.js';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from './categories.service.js';

export async function list(req: Request, res: Response) {
  const query = paginationQuerySchema.parse(req.query);
  const result = await listCategories(query);
  sendSuccess(res, result.items, 200, result.meta);
}

export async function detail(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await getCategory(id));
}

export async function create(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);
  sendSuccess(res, await createCategory(input), 201);
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateCategorySchema.parse(req.body);
  sendSuccess(res, await updateCategory(id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await deleteCategory(id));
}
