import { HistoryOutlined, PlusOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  App,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Grid,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/client';
import { listInventory } from '@/api/inventory';
import { createMovement, createTransfer } from '@/api/movements';
import { listProducts } from '@/api/products';
import { listWarehouses } from '@/api/warehouses';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { formatDate } from '@/lib/format';
import {
  movementFormSchema,
  transferFormSchema,
  type MovementFormValues,
  type TransferFormValues,
} from '@/lib/validation/inventory';
import type { Product, Warehouse } from '@/types/catalog';
import type { InventoryItem } from '@/types/inventory';

const movementDefaults: MovementFormValues = {
  productId: '',
  warehouseId: '',
  type: 'RECEIPT',
  quantity: 1,
  reference: '',
  note: '',
};

const transferDefaults: TransferFormValues = {
  productId: '',
  fromWarehouseId: '',
  toWarehouseId: '',
  quantity: 1,
  reference: '',
  note: '',
};

const statusLabels = {
  out: 'Out of stock',
  low: 'Low stock',
  ok: 'Healthy',
} as const;

const statusColors = {
  out: 'red',
  low: 'gold',
  ok: 'green',
} as const;

export function InventoryPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const navigate = useNavigate();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [savingMovement, setSavingMovement] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);

  const {
    control: movementControl,
    handleSubmit: handleMovementSubmit,
    reset: resetMovement,
    formState: { isSubmitting: movementSubmitting },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: movementDefaults,
  });

  const {
    control: transferControl,
    handleSubmit: handleTransferSubmit,
    reset: resetTransfer,
    formState: { isSubmitting: transferSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: transferDefaults,
  });

  const movementType = useWatch({ control: movementControl, name: 'type' });
  const selectedProductId = useWatch({ control: movementControl, name: 'productId' });
  const selectedWarehouseId = useWatch({ control: movementControl, name: 'warehouseId' });
  const selectedBalance = items.find(
    (row) => row.productId === selectedProductId && row.warehouseId === selectedWarehouseId,
  );

  const requestKey = `${page}|${pageSize}|${search}|${warehouseId}|${lowStock}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    listInventory({
      page,
      pageSize,
      search: search || undefined,
      warehouseId: warehouseId || undefined,
      lowStock,
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
  }, [lowStock, message, page, pageSize, reloadKey, requestKey, search, warehouseId]);

  useEffect(() => {
    let active = true;

    Promise.all([listProducts({ pageSize: 100 }), listWarehouses({ pageSize: 100 })])
      .then(([productResult, warehouseResult]) => {
        if (!active) return;
        setProducts(productResult.items);
        setWarehouses(warehouseResult.items);
      })
      .catch((error: unknown) => {
        if (active) message.error(getApiErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [message]);

  function resetFilters() {
    setPage(1);
    setSearchInput('');
    setSearch('');
    setWarehouseId('');
    setLowStock(false);
  }

  function openMovement(row?: InventoryItem, type: MovementFormValues['type'] = 'RECEIPT') {
    resetMovement({
      ...movementDefaults,
      type,
      productId: row?.productId ?? '',
      warehouseId: row?.warehouseId ?? '',
    });
    setMovementOpen(true);
  }

  function openTransfer(row?: InventoryItem) {
    resetTransfer({
      ...transferDefaults,
      productId: row?.productId ?? '',
      fromWarehouseId: row?.warehouseId ?? '',
    });
    setTransferOpen(true);
  }

  async function onSubmitMovement(values: MovementFormValues) {
    setSavingMovement(true);

    try {
      await createMovement({
        productId: values.productId,
        warehouseId: values.warehouseId,
        type: values.type,
        quantity: values.quantity,
        reference: values.reference?.trim() || null,
        note: values.note?.trim() || null,
      });
      message.success('Stock movement recorded');
      setMovementOpen(false);
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSavingMovement(false);
    }
  }

  async function onSubmitTransfer(values: TransferFormValues) {
    setSavingTransfer(true);

    try {
      const result = await createTransfer({
        productId: values.productId,
        fromWarehouseId: values.fromWarehouseId,
        toWarehouseId: values.toWarehouseId,
        quantity: values.quantity,
        reference: values.reference?.trim() || null,
        note: values.note?.trim() || null,
      });
      message.success(`Stock transferred (${result.reference})`);
      setTransferOpen(false);
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSavingTransfer(false);
    }
  }

  const columns: TableColumnsType<InventoryItem> = [
    {
      title: 'Product',
      key: 'product',
      width: 280,
      fixed: 'left',
      render: (_value, record) => (
        <div className="min-w-0">
          <div className="font-mono text-xs text-slate-500">{record.product.sku}</div>
          <div className="truncate font-medium text-slate-800">{record.product.name}</div>
          <div className="text-xs text-slate-500">
            {record.product.category.name} · {record.product.unit}
          </div>
        </div>
      ),
    },
    {
      title: 'Warehouse',
      key: 'warehouse',
      width: 200,
      render: (_value, record) => (
        <div>
          <div className="font-medium text-slate-700">{record.warehouse.name}</div>
          <Tag bordered={false} className="!mt-1 !mr-0">
            {record.warehouse.code}
          </Tag>
        </div>
      ),
    },
    {
      title: 'On hand',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (quantity: number, record) => (
        <span
          className={
            record.status === 'ok' ? 'font-medium text-slate-800' : 'font-semibold text-amber-600'
          }
        >
          {quantity.toLocaleString()} {record.product.unit}
        </span>
      ),
    },
    {
      title: 'Minimum',
      key: 'minStock',
      width: 120,
      align: 'right',
      render: (_value, record) => record.product.minStock.toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: InventoryItem['status']) => (
        <Tag color={statusColors[status]} bordered={false}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (value: string) => <span className="text-slate-500">{formatDate(value)}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 230,
      fixed: 'right',
      render: (_value, record) => (
        <Space size={2} wrap>
          <Button type="link" size="small" onClick={() => openMovement(record, 'ADJUSTMENT')}>
            Adjust
          </Button>
          <Button type="link" size="small" onClick={() => openTransfer(record)}>
            Transfer
          </Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() =>
              navigate(
                `/movements?productId=${encodeURIComponent(record.productId)}&warehouseId=${encodeURIComponent(record.warehouseId)}`,
              )
            }
          >
            History
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Review balances by warehouse, record receipts and issues, adjust counts and transfer stock."
        breadcrumbs={[{ title: 'StockFlow', href: '/dashboard' }, { title: 'Inventory' }]}
        actions={
          <>
            <Button icon={<SwapOutlined />} onClick={() => openTransfer()}>
              Transfer
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openMovement()}>
              Record movement
            </Button>
          </>
        }
      />

      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input.Search
            className="w-full sm:max-w-xs"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search product, SKU or warehouse"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
          />
          <Select
            className="w-full sm:w-52"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All warehouses"
            value={warehouseId || undefined}
            onChange={(value) => {
              setWarehouseId(value ?? '');
              setPage(1);
            }}
            options={warehouses.map((warehouse) => ({
              label: warehouse.name,
              value: warehouse.id,
            }))}
          />
          <Checkbox
            checked={lowStock}
            onChange={(event) => {
              setLowStock(event.target.checked);
              setPage(1);
            }}
          >
            Low stock only
          </Checkbox>
          <Button onClick={resetFilters}>Reset</Button>
        </div>

        <Table<InventoryItem>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1240 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} inventory records`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title="Record stock movement"
        size={screens.md === false ? 360 : 560}
        open={movementOpen}
        onClose={() => {
          if (!savingMovement) setMovementOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setMovementOpen(false)}
              disabled={savingMovement || movementSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={savingMovement || movementSubmitting}
              onClick={() => void handleMovementSubmit(onSubmitMovement)()}
            >
              Record movement
            </Button>
          </div>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5">
          Every movement updates the warehouse balance and is kept in the audit trail.
        </Typography.Paragraph>

        <Form layout="vertical" requiredMark={false}>
          <FormField name="type" label="Movement type" control={movementControl} required>
            {(field) => (
              <Segmented
                {...field}
                block
                options={[
                  { label: 'Receipt', value: 'RECEIPT' },
                  { label: 'Issue', value: 'ISSUE' },
                  { label: 'Adjust', value: 'ADJUSTMENT' },
                ]}
              />
            )}
          </FormField>

          <FormField name="productId" label="Product" control={movementControl} required>
            {(field) => (
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                placeholder="Select a product"
                options={products.map((product) => ({
                  label: `${product.sku} — ${product.name}`,
                  value: product.id,
                }))}
              />
            )}
          </FormField>

          <FormField name="warehouseId" label="Warehouse" control={movementControl} required>
            {(field) => (
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                placeholder="Select a warehouse"
                options={warehouses.map((warehouse) => ({
                  label: warehouse.name,
                  value: warehouse.id,
                }))}
              />
            )}
          </FormField>

          {selectedBalance ? (
            <Typography.Paragraph type="secondary" className="!mb-4 !mt-0 text-xs">
              Current balance here: {selectedBalance.quantity.toLocaleString()}{' '}
              {selectedBalance.product.unit}
            </Typography.Paragraph>
          ) : null}

          <FormField
            name="quantity"
            label={movementType === 'ADJUSTMENT' ? 'Change by' : 'Quantity'}
            control={movementControl}
            extra={
              movementType === 'ADJUSTMENT'
                ? 'Use a negative number to reduce stock.'
                : 'Must not exceed the current balance for issues.'
            }
            required
          >
            {(field) => (
              <InputNumber
                {...field}
                min={movementType === 'ADJUSTMENT' ? -1_000_000_000 : 1}
                max={1_000_000_000}
                precision={0}
                style={{ width: '100%' }}
                placeholder={movementType === 'ADJUSTMENT' ? '0' : '1'}
              />
            )}
          </FormField>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="reference" label="Reference" control={movementControl}>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} placeholder="PO-1042" />;
              }}
            </FormField>

            <FormField name="note" label="Note" control={movementControl}>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} placeholder="Optional detail" />;
              }}
            </FormField>
          </div>
        </Form>
      </Drawer>

      <Drawer
        title="Transfer stock"
        size={screens.md === false ? 360 : 560}
        open={transferOpen}
        onClose={() => {
          if (!savingTransfer) setTransferOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setTransferOpen(false)}
              disabled={savingTransfer || transferSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={savingTransfer || transferSubmitting}
              onClick={() => void handleTransferSubmit(onSubmitTransfer)()}
            >
              Transfer stock
            </Button>
          </div>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5">
          Transfers create a matching issue and receipt movement with a shared reference.
        </Typography.Paragraph>

        <Form layout="vertical" requiredMark={false}>
          <FormField name="productId" label="Product" control={transferControl} required>
            {(field) => (
              <Select
                {...field}
                showSearch
                optionFilterProp="label"
                placeholder="Select a product"
                options={products.map((product) => ({
                  label: `${product.sku} — ${product.name}`,
                  value: product.id,
                }))}
              />
            )}
          </FormField>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="fromWarehouseId" label="From" control={transferControl} required>
              {(field) => (
                <Select
                  {...field}
                  placeholder="Source"
                  options={warehouses.map((warehouse) => ({
                    label: warehouse.name,
                    value: warehouse.id,
                  }))}
                />
              )}
            </FormField>

            <FormField name="toWarehouseId" label="To" control={transferControl} required>
              {(field) => (
                <Select
                  {...field}
                  placeholder="Destination"
                  options={warehouses.map((warehouse) => ({
                    label: warehouse.name,
                    value: warehouse.id,
                  }))}
                />
              )}
            </FormField>
          </div>

          <FormField name="quantity" label="Quantity" control={transferControl} required>
            {(field) => (
              <InputNumber
                {...field}
                min={1}
                max={1_000_000_000}
                precision={0}
                style={{ width: '100%' }}
                placeholder="1"
              />
            )}
          </FormField>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="reference" label="Reference" control={transferControl}>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} placeholder="Optional transfer reference" />;
              }}
            </FormField>

            <FormField name="note" label="Note" control={transferControl}>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} placeholder="Optional detail" />;
              }}
            </FormField>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
