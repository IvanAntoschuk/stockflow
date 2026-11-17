import { SearchOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getApiErrorMessage } from '@/api/client';
import {
  getAnalyticsSummary,
  getLowStockReport,
  getMovementByType,
  getMovementTrend,
  getStockBreakdown,
} from '@/api/analytics';
import { listCategories } from '@/api/categories';
import { listMovements } from '@/api/movements';
import { listWarehouses } from '@/api/warehouses';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { getMovementLabel } from '@/lib/labels';
import type { Category, Warehouse } from '@/types/catalog';
import {
  stockMovementTypes,
  type StockMovement,
  type StockMovementType,
} from '@/types/inventory';
import type {
  AnalyticsSummary,
  LowStockRow,
  MovementByType,
  MovementTrend,
  StockBreakdownRow,
} from '@/types/analytics';

const typeColors: Record<StockMovementType, string> = {
  RECEIPT: '#059669',
  ISSUE: '#dc2626',
  ADJUSTMENT: '#d97706',
  TRANSFER_IN: '#0ea5e9',
  TRANSFER_OUT: '#64748b',
};

export function ReportsPage() {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = (searchParams.get('search') ?? '').trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? '10') || 10);
  const warehouseId = searchParams.get('warehouseId') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const rawType = searchParams.get('type') ?? '';
  const type = stockMovementTypes.includes(rawType as StockMovementType)
    ? (rawType as StockMovementType)
    : '';
  const rawFrom = searchParams.get('from') ?? '';
  const rawTo = searchParams.get('to') ?? '';
  const from = rawFrom && dayjs(rawFrom).isValid() ? rawFrom : undefined;
  const to = rawTo && dayjs(rawTo).isValid() ? rawTo : undefined;
  const dateRange: [Dayjs, Dayjs] | null = from && to ? [dayjs(from), dayjs(to)] : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [byType, setByType] = useState<MovementByType | null>(null);
  const [trend, setTrend] = useState<MovementTrend | null>(null);
  const [stockRows, setStockRows] = useState<StockBreakdownRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${page}|${pageSize}|${search}|${warehouseId}|${categoryId}|${type}|${from}|${to}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    Promise.all([
      getAnalyticsSummary({ warehouseId: warehouseId || undefined, categoryId: categoryId || undefined, from, to }),
      getMovementByType({
        warehouseId: warehouseId || undefined,
        categoryId: categoryId || undefined,
        type: type || undefined,
        from,
        to,
      }),
      getMovementTrend({
        warehouseId: warehouseId || undefined,
        categoryId: categoryId || undefined,
        type: type || undefined,
        from,
        to,
        granularity: 'day',
      }),
      getStockBreakdown({
        groupBy: 'warehouse',
        warehouseId: warehouseId || undefined,
        categoryId: categoryId || undefined,
      }),
      getLowStockReport({
        pageSize: 10,
        warehouseId: warehouseId || undefined,
        categoryId: categoryId || undefined,
      }),
      listMovements({
        page,
        pageSize,
        search: search || undefined,
        warehouseId: warehouseId || undefined,
        type: type || undefined,
        from,
        to,
      }),
    ])
      .then(([summaryResult, byTypeResult, trendResult, stockResult, lowStockResult, movementResult]) => {
        if (!active) return;
        setSummary(summaryResult);
        setByType(byTypeResult);
        setTrend(trendResult);
        setStockRows(stockResult.rows);
        setLowStock(lowStockResult.items);
        setMovements(movementResult.items);
        setTotalMovements(movementResult.meta.total);
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
  }, [categoryId, from, message, page, pageSize, requestKey, search, to, type, warehouseId]);

  useEffect(() => {
    let active = true;

    Promise.all([listCategories({ pageSize: 100 }), listWarehouses({ pageSize: 100 })])
      .then(([categoryResult, warehouseResult]) => {
        if (!active) return;
        setCategories(categoryResult.items);
        setWarehouses(warehouseResult.items);
      })
      .catch((error: unknown) => {
        if (active) message.error(getApiErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [message]);

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    next.delete('page');
    setSearchParams(next);
  }

  function resetFilters() {
    setSearchParams({});
  }

  const trendData = (trend?.series ?? []).map((point) => ({
    label: dayjs(point.period).format('MMM D'),
    received: point.receivedUnits,
    issued: point.issuedUnits,
  }));

  const typeData = (byType?.rows ?? []).map((row) => ({
    label: row.label,
    count: row.count,
    units: row.units,
    type: row.type,
  }));

  const movementColumns: TableColumnsType<StockMovement> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (value: StockMovementType, record) => (
        <Tag bordered={false} color={record.quantity >= 0 ? 'green' : 'red'}>
          {getMovementLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Product',
      key: 'product',
      width: 240,
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
      width: 150,
      render: (_value, record) => record.warehouse.name,
    },
    {
      title: 'Change',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (_value, record) => (
        <span className={record.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          {record.quantity >= 0 ? '+' : ''}
          {record.quantity.toLocaleString()} {record.product.unit}
        </span>
      ),
    },
    {
      title: 'Balance',
      key: 'balance',
      width: 150,
      align: 'right',
      render: (_value, record) =>
        `${record.previousQuantity.toLocaleString()} → ${record.newQuantity.toLocaleString()}`,
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 160,
      render: (value: string | null) =>
        value ? <span className="font-mono text-xs text-slate-600">{value}</span> : '—',
    },
  ];

  const lowStockColumns: TableColumnsType<LowStockRow> = [
    {
      title: 'Product',
      key: 'product',
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
      width: 150,
      render: (_value, record) => record.warehouse.name,
    },
    {
      title: 'Balance',
      key: 'quantity',
      width: 110,
      align: 'right',
      render: (_value, record) => (
        <span className="font-medium text-slate-700">
          {record.quantity.toLocaleString()} / {record.minStock.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: 'out' | 'low') => (
        <Tag bordered={false} color={value === 'out' ? 'red' : 'warning'}>
          {value === 'out' ? 'Out' : 'Low'}
        </Tag>
      ),
    },
  ];

  const valuationColumns: TableColumnsType<StockBreakdownRow> = [
    {
      title: 'Warehouse',
      dataIndex: 'label',
      key: 'label',
      render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
    },
    {
      title: 'SKUs',
      dataIndex: 'skuCount',
      key: 'skuCount',
      width: 90,
      align: 'right',
    },
    {
      title: 'Units',
      dataIndex: 'totalUnits',
      key: 'totalUnits',
      width: 110,
      align: 'right',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'At cost',
      dataIndex: 'inventoryValueAtCost',
      key: 'inventoryValueAtCost',
      width: 130,
      align: 'right',
      render: (value: string) => formatCurrency(value),
    },
    {
      title: 'At selling',
      dataIndex: 'inventoryValueAtSelling',
      key: 'inventoryValueAtSelling',
      width: 140,
      align: 'right',
      render: (value: string) => formatCurrency(value),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Review inventory valuation, movement activity and stock alerts across the workspace."
        breadcrumbs={[{ title: 'StockFlow' }, { title: 'Reports' }]}
        actions={<Button onClick={resetFilters}>Reset filters</Button>}
      />

      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <div className="flex flex-wrap items-center gap-3">
          <Input.Search
            key={`search-${search}`}
            className="w-full sm:max-w-xs"
            allowClear
            prefix={<SearchOutlined />}
            defaultValue={search}
            placeholder="Search product or reference"
            onSearch={(value) => updateParams({ search: value.trim() })}
          />
          <DatePicker.RangePicker
            className="w-full sm:w-64"
            value={dateRange}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                updateParams({
                  from: dates[0].startOf('day').toISOString(),
                  to: dates[1].endOf('day').toISOString(),
                });
              } else {
                updateParams({ from: '', to: '' });
              }
            }}
          />
          <Select
            className="w-full sm:w-44"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All warehouses"
            value={warehouseId || undefined}
            onChange={(value) => updateParams({ warehouseId: value ?? '' })}
            options={warehouses.map((warehouse) => ({
              label: warehouse.name,
              value: warehouse.id,
            }))}
          />
          <Select
            className="w-full sm:w-44"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All categories"
            value={categoryId || undefined}
            onChange={(value) => updateParams({ categoryId: value ?? '' })}
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
          />
          <Select
            className="w-full sm:w-40"
            allowClear
            placeholder="All types"
            value={type || undefined}
            onChange={(value) => updateParams({ type: value ?? '' })}
            options={stockMovementTypes.map((movementType) => ({
              label: getMovementLabel(movementType),
              value: movementType,
            }))}
          />
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 18 } }}>
          <Statistic title="Movements" value={summary?.movements.total ?? 0} />
        </Card>
        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 18 } }}>
          <Statistic
            title="Units received"
            value={summary?.movements.receivedUnits ?? 0}
            valueStyle={{ color: '#059669' }}
          />
        </Card>
        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 18 } }}>
          <Statistic
            title="Units issued"
            value={summary?.movements.issuedUnits ?? 0}
            valueStyle={{ color: '#dc2626' }}
          />
        </Card>
        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 18 } }}>
          <Statistic
            title="Inventory value"
            value={summary ? Number(summary.stock.inventoryValueAtCost) : 0}
            precision={2}
            prefix="$"
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
          <Typography.Title level={5} className="!mb-1">
            Movement trend
          </Typography.Title>
          <Typography.Text type="secondary" className="!mb-4 block text-xs">
            Daily units moving in and out of stock
          </Typography.Text>
          <div className="h-[280px] min-w-0">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Loading report" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No movements in this period" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="received"
                    name="Received"
                    stroke={typeColors.RECEIPT}
                    fill={typeColors.RECEIPT}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="issued"
                    name="Issued"
                    stroke={typeColors.ISSUE}
                    fill={typeColors.ISSUE}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
          <Typography.Title level={5} className="!mb-1">
            Movements by type
          </Typography.Title>
          <Typography.Text type="secondary" className="!mb-4 block text-xs">
            Count of recorded movements per operation
          </Typography.Text>
          <div className="h-[280px] min-w-0">
            {loading || typeData.every((row) => row.count === 0) ? (
              <div className="flex h-full items-center justify-center">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No movements in this period" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip />
                  <Bar dataKey="count" name="Movements" radius={[4, 4, 0, 0]}>
                    {typeData.map((row) => (
                      <Cell key={row.type} fill={typeColors[row.type]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6" style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <Typography.Title level={5} className="!mb-4">
          Movement history
        </Typography.Title>
        <Table<StockMovement>
          rowKey="id"
          columns={movementColumns}
          dataSource={movements}
          loading={loading}
          scroll={{ x: 1080 }}
          pagination={{
            current: page,
            pageSize,
            total: totalMovements,
            showSizeChanger: true,
            showTotal: (count) => `${count} movements`,
            onChange: (nextPage, nextPageSize) => {
              const next = new URLSearchParams(searchParams);
              if (nextPage > 1) {
                next.set('page', String(nextPage));
              } else {
                next.delete('page');
              }
              next.set('pageSize', String(nextPageSize));
              setSearchParams(next);
            },
          }}
        />
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
          <Typography.Title level={5} className="!mb-4">
            Stock valuation by warehouse
          </Typography.Title>
          <Table<StockBreakdownRow>
            rowKey="id"
            columns={valuationColumns}
            dataSource={stockRows}
            loading={loading}
            size="small"
            scroll={{ x: 620 }}
            pagination={false}
          />
        </Card>

        <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
          <Typography.Title level={5} className="!mb-4">
            Low-stock report
          </Typography.Title>
          <Table<LowStockRow>
            rowKey={(record) => `${record.product.id}-${record.warehouse.id}`}
            columns={lowStockColumns}
            dataSource={lowStock}
            loading={loading}
            size="small"
            scroll={{ x: 620 }}
            pagination={false}
            locale={{ emptyText: 'No low-stock balances' }}
          />
        </Card>
      </div>
    </>
  );
}
