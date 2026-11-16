import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: PaginationMeta) {
  res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}
