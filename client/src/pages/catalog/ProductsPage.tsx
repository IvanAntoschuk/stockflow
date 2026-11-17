import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  App,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { listCategories } from '@/api/categories';
import { getApiErrorMessage } from '@/api/client';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '@/api/products';
import { listSuppliers } from '@/api/suppliers';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDate } from '@/lib/format';
import { productFormSchema, type ProductFormValues } from '@/lib/validation/catalog';
import type { Category, Product, Supplier } from '@/types/catalog';

const defaults: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  supplierId: undefined,
  unit: 'pcs',
  costPrice: 0,
  sellingPrice: 0,
  minStock: 0,
};

export function ProductsPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = (searchParams.get('search') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults,
  });

  const requestKey = `${page}|${pageSize}|${search}|${categoryId}|${supplierId}|${includeArchived}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    listProducts({
      page,
      pageSize,
      search: search || undefined,
      categoryId: categoryId || undefined,
      supplierId: supplierId || undefined,
      includeArchived,
    })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.meta.total);
        setLoadedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (active) {
          message.error(getApiErrorMessage(error));
          setLoadedKey(requestKey);
        }
      });

    return () => {
      active = false;
    };
  }, [
    categoryId,
    includeArchived,
    message,
    page,
    pageSize,
    reloadKey,
    requestKey,
    search,
    supplierId,
  ]);

  useEffect(() => {
    let active = true;

    Promise.all([listCategories({ pageSize: 100 }), listSuppliers({ pageSize: 100 })])
      .then(([categoryResult, supplierResult]) => {
        if (!active) return;
        setCategories(categoryResult.items);
        setSuppliers(supplierResult.items);
      })
      .catch((error: unknown) => {
        if (active) message.error(getApiErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [message]);

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) {
      next.set('page', String(nextPage));
    } else {
      next.delete('page');
    }
    setSearchParams(next);
  }

  function applySearch(value: string) {
    const trimmed = value.trim();
    const next = new URLSearchParams();
    if (trimmed) next.set('search', trimmed);
    setSearchParams(next);
  }

  function resetFilters() {
    setSearchParams({});
    setCategoryId('');
    setSupplierId('');
    setIncludeArchived(false);
  }

  function openCreate() {
    setEditing(null);
    reset(defaults);
    setEditorOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    reset({
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      categoryId: product.categoryId,
      supplierId: product.supplierId ?? undefined,
      unit: product.unit,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      minStock: product.minStock,
    });
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) return;
    setEditorOpen(false);
  }

  function openDetail(product: Product) {
    setDetail(product);
    setDetailOpen(true);
    setDetailLoading(true);

    getProduct(product.id)
      .then(setDetail)
      .catch((error: unknown) => message.error(getApiErrorMessage(error)))
      .finally(() => setDetailLoading(false));
  }

  async function onSubmit(values: ProductFormValues) {
    setSaving(true);
    try {
      const payload = {
        sku: values.sku,
        name: values.name,
        description: values.description?.trim() || null,
        categoryId: values.categoryId,
        supplierId: values.supplierId || null,
        unit: values.unit,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        minStock: values.minStock,
      };

      if (editing) {
        await updateProduct(editing.id, payload);
        message.success('Product updated');
      } else {
        await createProduct(payload);
        message.success('Product created');
        setPage(1);
      }

      setEditorOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    try {
      const result = await deleteProduct(product.id);
      if (result.archived) {
        message.warning('Product archived because it still has stock');
      } else {
        message.success('Product deleted');
      }

      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  }

  async function handleRestore(product: Product) {
    try {
      await updateProduct(product.id, { isArchived: false });
      message.success('Product restored');
      setReloadKey((key) => key + 1);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  }

  const columns: TableColumnsType<Product> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      fixed: 'left',
      render: (sku: string) => <span className="font-mono text-[13px] text-slate-700">{sku}</span>,
    },
    {
      title: 'Product',
      key: 'name',
      width: 260,
      render: (_, record) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-800">{record.name}</div>
          <div className="truncate text-xs text-slate-500">{record.description || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      width: 150,
      render: (_, record) => <Tag>{record.category.name}</Tag>,
    },
    {
      title: 'Supplier',
      key: 'supplier',
      width: 170,
      render: (_, record) => (
        <span className="text-slate-600">{record.supplier?.name ?? '—'}</span>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 90,
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 110,
      align: 'right',
      render: (value: string) => formatCurrency(value),
    },
    {
      title: 'Selling price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 130,
      align: 'right',
      render: (value: string) => (
        <span className="font-medium text-slate-800">{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Min stock',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 110,
      align: 'right',
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      align: 'right',
      render: (stock: number, record) => (
        <span
          className={
            !record.isArchived && stock <= record.minStock
              ? 'font-medium text-amber-600'
              : 'text-slate-700'
          }
        >
          {stock}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => {
        if (record.isArchived) return <Tag>Archived</Tag>;
        if (record.stock === 0) return <Tag color="red">Out of stock</Tag>;
        if (record.stock <= record.minStock) return <Tag color="warning">Low stock</Tag>;
        return <Tag color="green">In stock</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            View
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          {record.isArchived ? (
            <Button
              type="link"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => void handleRestore(record)}
            >
              Restore
            </Button>
          ) : (
            <Popconfirm
              title="Delete this product?"
              description={
                record.stock !== 0
                  ? 'This product has stock and will be archived instead of deleted.'
                  : 'This product will be permanently deleted.'
              }
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleDelete(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage SKUs, pricing, categories and stock thresholds."
        breadcrumbs={[{ title: 'StockFlow' }, { title: 'Products' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add product
          </Button>
        }
      />

      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input.Search
            key={`search-${search}`}
            allowClear
            defaultValue={search}
            onSearch={applySearch}
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search by product name or SKU"
            className="w-full sm:max-w-xs"
          />

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={categoryId || undefined}
            onChange={(value) => {
              setCategoryId(value ?? '');
              setPage(1);
            }}
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
            placeholder="All categories"
            className="w-full sm:w-48"
          />

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={supplierId || undefined}
            onChange={(value) => {
              setSupplierId(value ?? '');
              setPage(1);
            }}
            options={suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))}
            placeholder="All suppliers"
            className="w-full sm:w-48"
          />

          <Checkbox
            checked={includeArchived}
            onChange={(event) => {
              setIncludeArchived(event.target.checked);
              setPage(1);
            }}
          >
            Show archived
          </Checkbox>

          <Button onClick={resetFilters}>Reset</Button>
        </div>

        <Table<Product>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1650 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} products`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title={editing ? 'Edit product' : 'New product'}
        size={screens.md === false ? 360 : 620}
        open={editorOpen}
        onClose={closeEditor}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={saving || isSubmitting}
              onClick={() => void handleSubmit(onSubmit)()}
            >
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5">
          Products with stock are archived on delete so inventory history stays intact.
        </Typography.Paragraph>

        <Form layout="vertical" requiredMark={false}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="sku" label="SKU" control={control} required>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} id="sku" placeholder="SKU-1001" />;
              }}
            </FormField>

            <FormField name="unit" label="Unit" control={control} required>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} id="unit" placeholder="pcs" />;
              }}
            </FormField>
          </div>

          <FormField name="name" label="Product name" control={control} required>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="name" placeholder="A4 Copy Paper" />;
            }}
          </FormField>

          <FormField name="description" label="Description" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return (
                <Input.TextArea
                  {...fieldProps}
                  id="description"
                  rows={2}
                  placeholder="Pack size, material or other details"
                />
              );
            }}
          </FormField>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="categoryId" label="Category" control={control} required>
              {(field) => (
                <Select
                  {...field}
                  id="categoryId"
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select a category"
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                />
              )}
            </FormField>

            <FormField name="supplierId" label="Supplier" control={control}>
              {(field) => (
                <Select
                  {...field}
                  id="supplierId"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select a supplier"
                  options={suppliers.map((supplier) => ({
                    label: supplier.name,
                    value: supplier.id,
                  }))}
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="costPrice" label="Cost price" control={control} required>
              {(field) => (
                <InputNumber
                  {...field}
                  id="costPrice"
                  min={0}
                  precision={2}
                  prefix="$"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              )}
            </FormField>

            <FormField name="sellingPrice" label="Selling price" control={control} required>
              {(field) => (
                <InputNumber
                  {...field}
                  id="sellingPrice"
                  min={0}
                  precision={2}
                  prefix="$"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              )}
            </FormField>
          </div>

          <FormField name="minStock" label="Minimum stock" control={control} required>
            {(field) => (
              <InputNumber
                {...field}
                id="minStock"
                min={0}
                precision={0}
                style={{ width: '100%' }}
                placeholder="0"
              />
            )}
          </FormField>
        </Form>
      </Drawer>

      <Drawer
        title="Product details"
        size={screens.md === false ? 360 : 560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
      >
        {detail ? (
          <>
            <Descriptions
              column={1}
              size="small"
              colon={false}
              items={[
                { key: 'sku', label: 'SKU', children: detail.sku },
                { key: 'name', label: 'Name', children: detail.name },
                { key: 'description', label: 'Description', children: detail.description || '—' },
                { key: 'category', label: 'Category', children: detail.category.name },
                {
                  key: 'supplier',
                  label: 'Supplier',
                  children: detail.supplier?.name ?? '—',
                },
                { key: 'unit', label: 'Unit', children: detail.unit },
                {
                  key: 'costPrice',
                  label: 'Cost price',
                  children: formatCurrency(detail.costPrice),
                },
                {
                  key: 'sellingPrice',
                  label: 'Selling price',
                  children: formatCurrency(detail.sellingPrice),
                },
                { key: 'minStock', label: 'Minimum stock', children: detail.minStock },
                { key: 'stock', label: 'Total stock', children: detail.stock },
                {
                  key: 'status',
                  label: 'Status',
                  children: detail.isArchived ? (
                    <Tag>Archived</Tag>
                  ) : detail.stock === 0 ? (
                    <Tag color="red">Out of stock</Tag>
                  ) : detail.stock <= detail.minStock ? (
                    <Tag color="warning">Low stock</Tag>
                  ) : (
                    <Tag color="green">In stock</Tag>
                  ),
                },
                { key: 'created', label: 'Created', children: formatDate(detail.createdAt) },
                { key: 'updated', label: 'Updated', children: formatDate(detail.updatedAt) },
              ]}
            />

            <Typography.Title level={5} className="!mb-3 !mt-6">
              Stock by warehouse
            </Typography.Title>

            {detail.inventory.length > 0 ? (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detail.inventory}
                columns={[
                  {
                    title: 'Warehouse',
                    key: 'warehouse',
                    render: (_, row) => row.warehouse.name,
                  },
                  {
                    title: 'Code',
                    key: 'code',
                    width: 90,
                    render: (_, row) => <Tag>{row.warehouse.code}</Tag>,
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 100,
                    align: 'right',
                  },
                ]}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No stock recorded for this product yet"
              />
            )}
          </>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Product not found" />
        )}
      </Drawer>
    </>
  );
}
