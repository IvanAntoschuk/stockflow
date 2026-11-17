import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Grid,
  Input,
  Select,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/client';
import { getMovement, listMovements } from '@/api/movements';
import { listProducts } from '@/api/products';
import { listWarehouses } from '@/api/warehouses';
import { PageHeader } from '@/components/PageHeader';
import { formatDateTime } from '@/lib/format';
import { getMovementLabel } from '@/lib/labels';
import type { Product, Warehouse } from '@/types/catalog';
import { stockMovementTypes, type StockMovement, type StockMovementType } from '@/types/inventory';

export function MovementsPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = (searchParams.get('search') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const productId = searchParams.get('productId') ?? '';
  const warehouseId = searchParams.get('warehouseId') ?? '';
  const rawType = searchParams.get('type') ?? '';
  const type = stockMovementTypes.includes(rawType as StockMovementType)
    ? (rawType as StockMovementType)
    : '';

  const [items, setItems] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<StockMovement | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const requestKey = `${page}|${pageSize}|${search}|${productId}|${warehouseId}|${type}|${from}|${to}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    listMovements({
      page,
      pageSize,
      search: search || undefined,
      productId: productId || undefined,
      warehouseId: warehouseId || undefined,
      type: type || undefined,
      from,
      to,
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
  }, [from, message, page, pageSize, productId, requestKey, search, to, type, warehouseId]);

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

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) {
      next.set('page', String(nextPage));
    } else {
      next.delete('page');
    }
    setSearchParams(next);
  }

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
  }

  function resetFilters() {
    setSearchParams({});
    setDateRange(null);
    setFrom(undefined);
    setTo(undefined);
  }

  function openDetail(movement: StockMovement) {
    setDetail(movement);
    setDetailOpen(true);
    setDetailLoading(true);

    getMovement(movement.id)
      .then(setDetail)
      .catch((error: unknown) => message.error(getApiErrorMessage(error)))
      .finally(() => setDetailLoading(false));
  }

  function renderChange(movement: StockMovement) {
    const positive = movement.quantity >= 0;
    return (
      <span className={positive ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
        {positive ? '+' : ''}
        {movement.quantity.toLocaleString()} {movement.product.unit}
      </span>
    );
  }

  const columns: TableColumnsType<StockMovement> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value: string) => (
        <span className="text-slate-600">{formatDateTime(value)}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (value: StockMovementType, record) => (
        <Tag bordered={false} color={record.quantity >= 0 ? 'green' : 'red'}>
          {getMovementLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Product',
      key: 'product',
      width: 260,
      render: (_value, record) => (
        <div className="min-w-0">
          <div className="font-mono text-xs text-slate-500">{record.product.sku}</div>
          <div className="truncate font-medium text-slate-800">{record.product.name}</div>
        </div>
      ),
    },
    {
      title: 'Warehouse',
      key: 'warehouse',
      width: 180,
      render: (_value, record) => (
        <div>
          <div className="text-slate-700">{record.warehouse.name}</div>
          <div className="text-xs text-slate-500">{record.warehouse.code}</div>
        </div>
      ),
    },
    {
      title: 'Change',
      key: 'quantity',
      width: 130,
      align: 'right',
      render: (_value, record) => renderChange(record),
    },
    {
      title: 'Balance',
      key: 'balance',
      width: 160,
      align: 'right',
      render: (_value, record) => (
        <span className="text-slate-600">
          {record.previousQuantity.toLocaleString()} → {record.newQuantity.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 170,
      render: (value: string | null) =>
        value ? <span className="font-mono text-xs text-slate-600">{value}</span> : '—',
    },
    {
      title: 'Recorded by',
      key: 'user',
      width: 150,
      render: (_value, record) => record.user.name,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_value, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Movements"
        description="A permanent audit trail of every receipt, issue, adjustment and stock transfer."
        breadcrumbs={[{ title: 'StockFlow' }, { title: 'Movements' }]}
        actions={
          <Button type="primary" onClick={() => navigate('/inventory')}>
            Record movement
          </Button>
        }
      />

      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input.Search
            key={`search-${search}`}
            className="w-full sm:max-w-xs"
            allowClear
            prefix={<SearchOutlined />}
            defaultValue={search}
            placeholder="Search product, reference, note or user"
            onSearch={(value) => updateParam('search', value.trim())}
          />
          <Select
            className="w-full sm:w-44"
            allowClear
            placeholder="All types"
            value={type || undefined}
            onChange={(value) => updateParam('type', value ?? '')}
            options={stockMovementTypes.map((movementType) => ({
              label: getMovementLabel(movementType),
              value: movementType,
            }))}
          />
          <Select
            className="w-full sm:w-48"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All products"
            value={productId || undefined}
            onChange={(value) => updateParam('productId', value ?? '')}
            options={products.map((product) => ({
              label: `${product.sku} — ${product.name}`,
              value: product.id,
            }))}
          />
          <Select
            className="w-full sm:w-44"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All warehouses"
            value={warehouseId || undefined}
            onChange={(value) => updateParam('warehouseId', value ?? '')}
            options={warehouses.map((warehouse) => ({
              label: warehouse.name,
              value: warehouse.id,
            }))}
          />
          <DatePicker.RangePicker
            className="w-full sm:w-64"
            value={dateRange}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setDateRange([dates[0], dates[1]]);
                setFrom(dates[0].startOf('day').toISOString());
                setTo(dates[1].endOf('day').toISOString());
              } else {
                setDateRange(null);
                setFrom(undefined);
                setTo(undefined);
              }
              setPage(1);
            }}
          />
          <Button onClick={resetFilters}>Reset</Button>
        </div>

        <Table<StockMovement>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} movements`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title="Movement details"
        size={screens.md === false ? 360 : 520}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
      >
        {detail ? (
          <>
            <Typography.Paragraph type="secondary" className="!mb-4">
              {getMovementLabel(detail.type)} · {formatDateTime(detail.createdAt)}
            </Typography.Paragraph>
            <Descriptions
              column={1}
              size="small"
              colon={false}
              items={[
                { key: 'product', label: 'Product', children: `${detail.product.sku} — ${detail.product.name}` },
                { key: 'warehouse', label: 'Warehouse', children: detail.warehouse.name },
                { key: 'change', label: 'Change', children: renderChange(detail) },
                {
                  key: 'balance',
                  label: 'Balance',
                  children: `${detail.previousQuantity.toLocaleString()} → ${detail.newQuantity.toLocaleString()} ${detail.product.unit}`,
                },
                { key: 'user', label: 'Recorded by', children: detail.user.name },
                { key: 'reference', label: 'Reference', children: detail.reference || '—' },
                { key: 'note', label: 'Note', children: detail.note || '—' },
              ]}
            />
            <Typography.Paragraph type="secondary" className="!mb-0 !mt-4 text-xs">
              {detail.quantity >= 0
                ? 'This movement increased the warehouse balance.'
                : 'This movement decreased the warehouse balance.'}
            </Typography.Paragraph>
          </>
        ) : null}
      </Drawer>
    </>
  );
}
