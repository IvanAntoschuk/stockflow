import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import {
  createWarehouseSchema,
  idParamSchema,
  paginationQuerySchema,
  updateWarehouseSchema,
} from './catalog.schemas.js';
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  listWarehouses,
  updateWarehouse,
} from './warehouses.service.js';

export async function list(req: Request, res: Response) {
  const query = paginationQuerySchema.parse(req.query);
  const result = await listWarehouses(query);
  sendSuccess(res, result.items, 200, result.meta);
}

export async function detail(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await getWarehouse(id));
}

export async function create(req: Request, res: Response) {
  const input = createWarehouseSchema.parse(req.body);
  sendSuccess(res, await createWarehouse(input), 201);
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateWarehouseSchema.parse(req.body);
  sendSuccess(res, await updateWarehouse(id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await deleteWarehouse(id));
}
