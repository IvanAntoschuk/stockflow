import { api, getPaginated } from './client';
import type { ApiSuccess } from '@/types/api';
import type {
  MovementListParams,
  MovementPayload,
  StockMovement,
  TransferPayload,
  TransferResult,
} from '@/types/inventory';

export function listMovements(params: MovementListParams = {}) {
  return getPaginated<StockMovement>('/movements', params);
}

export async function getMovement(id: string): Promise<StockMovement> {
  const { data } = await api.get<ApiSuccess<StockMovement>>(`/movements/${id}`);
  return data.data;
}

export async function createMovement(payload: MovementPayload): Promise<StockMovement> {
  const { data } = await api.post<ApiSuccess<StockMovement>>('/movements', payload);
  return data.data;
}

export async function createTransfer(payload: TransferPayload): Promise<TransferResult> {
  const { data } = await api.post<ApiSuccess<TransferResult>>('/movements/transfer', payload);
  return data.data;
}
