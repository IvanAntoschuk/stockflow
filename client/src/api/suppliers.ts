import { api, getPaginated } from './client';
import type { ApiSuccess } from '@/types/api';
import type { ListParams, Supplier, SupplierPayload } from '@/types/catalog';

export function listSuppliers(params: ListParams = {}) {
  return getPaginated<Supplier>('/suppliers', params);
}

export async function getSupplier(id: string): Promise<Supplier> {
  const { data } = await api.get<ApiSuccess<Supplier>>(`/suppliers/${id}`);
  return data.data;
}

export async function createSupplier(payload: SupplierPayload): Promise<Supplier> {
  const { data } = await api.post<ApiSuccess<Supplier>>('/suppliers', payload);
  return data.data;
}

export async function updateSupplier(
  id: string,
  payload: Partial<SupplierPayload>,
): Promise<Supplier> {
  const { data } = await api.patch<ApiSuccess<Supplier>>(`/suppliers/${id}`, payload);
  return data.data;
}

export async function deleteSupplier(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/suppliers/${id}`);
  return data.data;
}
