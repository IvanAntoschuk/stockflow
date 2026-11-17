import { api, getPaginated } from './client';
import type { ApiSuccess } from '@/types/api';
import type { Category, CategoryPayload, ListParams } from '@/types/catalog';

export function listCategories(params: ListParams = {}) {
  return getPaginated<Category>('/categories', params);
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await api.get<ApiSuccess<Category>>(`/categories/${id}`);
  return data.data;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await api.post<ApiSuccess<Category>>('/categories', payload);
  return data.data;
}

export async function updateCategory(
  id: string,
  payload: Partial<CategoryPayload>,
): Promise<Category> {
  const { data } = await api.patch<ApiSuccess<Category>>(`/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id: string): Promise<{ deleted: boolean }> {
  const { data } = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/categories/${id}`);
  return data.data;
}
