import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import {
  createSupplierSchema,
  idParamSchema,
  paginationQuerySchema,
  updateSupplierSchema,
} from './catalog.schemas.js';
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from './suppliers.service.js';

export async function list(req: Request, res: Response) {
  const query = paginationQuerySchema.parse(req.query);
  const result = await listSuppliers(query);
  sendSuccess(res, result.items, 200, result.meta);
}

export async function detail(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await getSupplier(id));
}

export async function create(req: Request, res: Response) {
  const input = createSupplierSchema.parse(req.body);
  sendSuccess(res, await createSupplier(input), 201);
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateSupplierSchema.parse(req.body);
  sendSuccess(res, await updateSupplier(id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await deleteSupplier(id));
}
