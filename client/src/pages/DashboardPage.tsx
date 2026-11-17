import {
  ArrowRightOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Spin,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  getMovementTrend,
  getStockBreakdown,
} from '@/api/analytics';
import { useAppSelector } from '@/app/hooks';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { getRoleLabel } from '@/lib/labels';
import type {
  AnalyticsSummary,
  LowStockRow,
  MovementTrendPoint,
  StockBreakdownRow,
} from '@/types/analytics';

const chartColors = {
  emerald: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  slate: '#94a3b8',
};

const kpiToneClass = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  slate: 'text-slate-800',
};

type KpiTone = keyof typeof kpiToneClass;

interface KpiCardProps {
  title: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone: KpiTone;
  loading: boolean;
}

function KpiCard({ title, value, hint, icon, tone, loading }: KpiCardProps) {
  return (
    <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 18 } }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
          <div className={`mt-2 truncate text-2xl font-semibold ${kpiToneClass[tone]}`}>
            {loading ? <Spin size="small" /> : value}
          </div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          {icon}
        </span>
      </div>
      <div className="mt-2 truncate text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  loading: boolean;
  empty: boolean;
  children: ReactNode;
  extra?: ReactNode;
  height?: string;
}

function ChartCard({
  title,
  subtitle,
  loading,
  empty,
  children,
  extra,
  height = 'h-[260px]',
}: ChartCardProps) {
  return (
    <Card
      title={title}
      extra={extra}
      style={{ borderRadius: 14 }}
      styles={{ body: { padding: 20 } }}
    >
      <p className="-mt-1 mb-4 text-xs text-slate-500">{subtitle}</p>
      <div className={`${height} min-w-0`}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spin />
          </div>
        ) : empty ? (
          <div className="flex h-full items-center justify-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data for this period" />
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const firstName = user?.name.split(' ')[0] ?? 'there';

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);
  const from = dateRange[0].startOf('day').toISOString();
  const to = dateRange[1].endOf('day').toISOString();
  const requestKey = `${from}|${to}`;

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<MovementTrendPoint[]>([]);
  const [categoryRows, setCategoryRows] = useState<StockBreakdownRow[]>([]);
  const [warehouseRows, setWarehouseRows] = useState<StockBreakdownRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);

  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    Promise.all([
      getAnalyticsSummary({ from, to }),
      getMovementTrend({ from, to, granularity: 'day' }),
      getStockBreakdown({ groupBy: 'category' }),
      getStockBreakdown({ groupBy: 'warehouse' }),
      getLowStockReport({ pageSize: 5 }),
    ])
      .then(([summaryResult, trendResult, categoryResult, warehouseResult, lowStockResult]) => {
        if (!active) return;
        setSummary(summaryResult);
        setTrend(trendResult.series);
        setCategoryRows(categoryResult.rows);
        setWarehouseRows(warehouseResult.rows);
        setLowStock(lowStockResult.items);
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
  }, [from, message, requestKey, to]);

  const trendData = trend.map((point) => ({
    label: dayjs(point.period).format('MMM D'),
    received: point.receivedUnits,
    issued: point.issuedUnits,
    count: point.movementCount,
  }));

  const categoryData = categoryRows.map((row) => ({
    label: row.label,
    value: Number(row.inventoryValueAtCost),
    skus: row.skuCount,
  }));

  const warehouseData = warehouseRows.map((row) => ({
    label: row.label,
    value: Number(row.inventoryValueAtCost),
    alerts: row.lowStockBalances + row.outOfStockBalances,
  }));

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
      width: 160,
      render: (_value, record) => record.warehouse.name,
    },
    {
      title: 'Balance',
      key: 'quantity',
      width: 120,
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
      width: 100,
      render: (value: 'out' | 'low') => (
        <Tag bordered={false} color={value === 'out' ? 'red' : 'warning'}>
          {value === 'out' ? 'Out of stock' : 'Low stock'}
        </Tag>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'stockValueAtCost',
      key: 'stockValueAtCost',
      width: 120,
      align: 'right',
      render: (value: string) => formatCurrency(value),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here is the live state of your StockFlow workspace.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <DatePicker.RangePicker
              value={dateRange}
              allowClear={false}
              onChange={(dates) => {
                if (dates?.[0] && dates?.[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
            />
            <Button type="primary" onClick={() => navigate('/reports')}>
              Open reports
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Active products"
          value={summary?.catalog.activeProducts ?? 0}
          hint={`${summary?.catalog.products ?? 0} total including archived`}
          icon={<ShoppingOutlined />}
          tone="emerald"
          loading={loading}
        />
        <KpiCard
          title="Units on hand"
          value={(summary?.stock.totalUnits ?? 0).toLocaleString()}
          hint="Across all warehouses"
          icon={<RiseOutlined />}
          tone="slate"
          loading={loading}
        />
        <KpiCard
          title="Inventory value"
          value={formatCurrency(summary?.stock.inventoryValueAtCost ?? 0)}
          hint="Valued at cost price"
          icon={<DollarOutlined />}
          tone="emerald"
          loading={loading}
        />
        <KpiCard
          title="Stock alerts"
          value={(summary?.stock.lowStockBalances ?? 0) + (summary?.stock.outOfStockBalances ?? 0)}
          hint={`${summary?.stock.outOfStockBalances ?? 0} out of stock`}
          icon={<ExclamationCircleOutlined />}
          tone={summary && summary.stock.outOfStockBalances > 0 ? 'red' : 'amber'}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Movement activity"
          subtitle="Units received and issued per day in the selected period"
          loading={loading}
          empty={trendData.length === 0}
          extra={
            <span className="text-xs text-slate-500">
              {summary?.movements.total.toLocaleString() ?? 0} movements
            </span>
          }
        >
          <div
            className="h-full w-full"
            role="img"
            aria-label="Daily received and issued units during the selected period"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="receivedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.emerald} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartColors.emerald} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="issuedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.red} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={chartColors.red} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="received"
                  name="Received"
                  stroke={chartColors.emerald}
                  fill="url(#receivedFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="issued"
                  name="Issued"
                  stroke={chartColors.red}
                  fill="url(#issuedFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Stock value by category"
          subtitle="On-hand inventory valued at cost price"
          loading={loading}
          empty={categoryData.length === 0}
        >
          <div
            className="h-full w-full"
            role="img"
            aria-label="On-hand inventory value grouped by category"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={92}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar
                  dataKey="value"
                  name="Value"
                  fill={chartColors.emerald}
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <ChartCard
          title="Warehouse distribution"
          subtitle="Cost value held at each warehouse"
          loading={loading}
          empty={warehouseData.length === 0}
        >
          <div
            className="h-full w-full"
            role="img"
            aria-label="Inventory cost value distributed across warehouses"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar
                  dataKey="value"
                  name="Value"
                  fill={chartColors.slate}
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card
          title="Stock alerts"
          extra={
            <Button type="link" size="small" onClick={() => navigate('/reports')}>
              View all
            </Button>
          }
          style={{ borderRadius: 14 }}
          styles={{ body: { padding: 20 } }}
        >
          <Table<LowStockRow>
            rowKey={(record) => `${record.product.id}-${record.warehouse.id}`}
            columns={lowStockColumns}
            dataSource={lowStock}
            loading={loading}
            size="small"
            scroll={{ x: 680 }}
            pagination={false}
            locale={{ emptyText: 'No low-stock balances' }}
          />
        </Card>
      </div>

      <Card className="mt-6" style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Typography.Title level={5} className="!mb-1">
              Your account
            </Typography.Title>
            <Typography.Text type="secondary">
              {user?.name ?? 'Workspace member'} · {user ? getRoleLabel(user.role) : 'Member'} ·
              Last movement {summary?.lastMovementAt ? formatDateTime(summary.lastMovementAt) : '—'}
            </Typography.Text>
          </div>
          <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/settings')}>
            Account settings
          </Button>
        </div>
      </Card>
    </>
  );
}
