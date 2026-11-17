import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { inventoryListQuerySchema } from './inventory.schemas.js';
import { listInventory } from './inventory.service.js';

export async function list(req: Request, res: Response) {
  const query = inventoryListQuerySchema.parse(req.query);
  const result = await listInventory(query);
  sendSuccess(res, result.items, 200, result.meta);
}
