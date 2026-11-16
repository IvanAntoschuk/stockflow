export interface Category {
  id: string;
  name: string;
  description: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  inventoryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReference {
  id: string;
  name: string;
}

export interface WarehouseReference {
  id: string;
  name: string;
  code: string;
}

export interface ProductInventory {
  id: string;
  warehouseId: string;
  quantity: number;
  warehouse: WarehouseReference;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  category: ProductReference;
  supplierId: string | null;
  supplier: ProductReference | null;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  minStock: number;
  isArchived: boolean;
  stock: number;
  inventory: ProductInventory[];
  createdAt: string;
  updatedAt: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProductListParams extends ListParams {
  categoryId?: string;
  supplierId?: string;
  includeArchived?: boolean;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
}

export interface SupplierPayload {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface WarehousePayload {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
}

export interface ProductPayload {
  sku: string;
  name: string;
  description?: string | null;
  categoryId: string;
  supplierId?: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  isArchived?: boolean;
}

export interface ProductDeleteResult {
  deleted: boolean;
  archived: boolean;
  product: Product | null;
}
