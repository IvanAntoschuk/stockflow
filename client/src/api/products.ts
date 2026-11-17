import { api, getPaginated } from './client';
import type { ApiSuccess } from '@/types/api';
import type {
  Product,
  ProductDeleteResult,
  ProductListParams,
  ProductPayload,
} from '@/types/catalog';

export function listProducts(params: ProductListParams = {}) {
  return getPaginated<Product>('/products', params);
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<ApiSuccess<Product>>(`/products/${id}`);
  return data.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await api.post<ApiSuccess<Product>>('/products', payload);
  return data.data;
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<Product> {
  const { data } = await api.patch<ApiSuccess<Product>>(`/products/${id}`, payload);
  return data.data;
}

export async function deleteProduct(id: string): Promise<ProductDeleteResult> {
  const { data } = await api.delete<ApiSuccess<ProductDeleteResult>>(`/products/${id}`);
  return data.data;
}
