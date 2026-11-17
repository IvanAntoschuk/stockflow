import type { Request, Response } from 'express';
import { getAuthUser } from '../auth/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import {
  createMovementSchema,
  createTransferSchema,
  idParamSchema,
  movementListQuerySchema,
} from './inventory.schemas.js';
import { createMovement, createTransfer, getMovement, listMovements } from './movements.service.js';

export async function list(req: Request, res: Response) {
  const query = movementListQuerySchema.parse(req.query);
  const result = await listMovements(query);
  sendSuccess(res, result.items, 200, result.meta);
}

export async function detail(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  sendSuccess(res, await getMovement(id));
}

export async function create(req: Request, res: Response) {
  const input = createMovementSchema.parse(req.body);
  sendSuccess(res, await createMovement(input, getAuthUser(req).id), 201);
}

export async function transfer(req: Request, res: Response) {
  const input = createTransferSchema.parse(req.body);
  sendSuccess(res, await createTransfer(input, getAuthUser(req).id), 201);
}
