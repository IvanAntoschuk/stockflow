import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import {
  createProductSchema,
  idParamSchema,
  productListQuerySchema,
  updateProductSchema,
} from './catalog.schemas.js';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './products.service.js';

export async function list(req: Request, res: Response) {
  const query = productListQuerySchema.parse(req.query);
  const result = await listProducts(query);
  sendSuccess(res, result.items, 200, result.meta);
}

export async function detail(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await getProduct(id));
}

export async function create(req: Request, res: Response) {
  const input = createProductSchema.parse(req.body);
  sendSuccess(res, await createProduct(input), 201);
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateProductSchema.parse(req.body);
  sendSuccess(res, await updateProduct(id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await deleteProduct(id));
}
