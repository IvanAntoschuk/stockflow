import { getPaginated } from './client';
import type { InventoryItem, InventoryListParams } from '@/types/inventory';

export function listInventory(params: InventoryListParams = {}) {
  return getPaginated<InventoryItem>('/inventory', params);
}
