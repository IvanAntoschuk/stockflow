import { api, getPaginated } from './client';
import type { ApiSuccess } from '@/types/api';
import type { ListParams, Warehouse, WarehousePayload } from '@/types/catalog';

export function listWarehouses(params: ListParams = {}) {
  return getPaginated<Warehouse>('/warehouses', params);
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  const { data } = await api.get<ApiSuccess<Warehouse>>(`/warehouses/${id}`);
  return data.data;
}

export async function createWarehouse(payload: WarehousePayload): Promise<Warehouse> {
  const { data } = await api.post<ApiSuccess<Warehouse>>('/warehouses', payload);
  return data.data;
}

export async function updateWarehouse(
  id: string,
  payload: Partial<WarehousePayload>,
): Promise<Warehouse> {
  const { data } = await api.patch<ApiSuccess<Warehouse>>(`/warehouses/${id}`, payload);
  return data.data;
}

export async function deleteWarehouse(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/warehouses/${id}`);
  return data.data;
}
