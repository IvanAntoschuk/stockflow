import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { PageHeader } from '@/components/PageHeader';
import { getRoleLabel } from '@/lib/labels';

interface SetupStep {
  title: string;
  description: string;
  state: 'complete' | 'next' | 'upcoming';
  action?: { label: string; path: string };
}

const steps: SetupStep[] = [
  {
    title: 'Secure your workspace',
    description: 'JWT authentication, protected routes and role-ready accounts are active.',
    state: 'complete',
  },
  {
    title: 'Build your product catalog',
    description: 'Create categories, suppliers and products with unique SKUs and pricing.',
    state: 'complete',
    action: { label: 'Open products', path: '/products' },
  },
  {
    title: 'Configure warehouse locations',
    description: 'Set up each location that will hold its own inventory balances.',
    state: 'complete',
    action: { label: 'Open warehouses', path: '/warehouses' },
  },
  {
    title: 'Record stock movements',
    description: 'Receive, issue, adjust and transfer stock with a complete audit trail.',
    state: 'complete',
    action: { label: 'View movements', path: '/movements' },
  },
];

function StepIcon({ state }: { state: SetupStep['state'] }) {
  if (state === 'complete') {
    return <CheckCircleFilled className="text-[18px] text-emerald-600" />;
  }
  if (state === 'next') {
    return <ClockCircleOutlined className="text-[18px] text-amber-600" />;
  }
  return <span className="block h-[18px] w-[18px] rounded-full border-2 border-slate-200" />;
}

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here is the current state of your StockFlow workspace.`}
        actions={
          <Button
            type="primary"
            icon={<ArrowRightOutlined rotate={-45} />}
            onClick={() => navigate('/products')}
          >
            View products
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card
          title="Workspace setup"
          extra={<Tag color="green">Secure</Tag>}
          style={{ borderRadius: 14 }}
          styles={{ body: { padding: 24 } }}
        >
          <p className="mb-5 text-sm leading-6 text-slate-600">
            Your authentication, catalog and inventory layers are live. Reporting and analytics are
            the final piece.
          </p>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <StepIcon state={step.state} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{step.title}</span>
                    {step.state === 'complete' ? (
                      <Tag color="success" className="!mr-0">
                        Complete
                      </Tag>
                    ) : null}
                    {step.state === 'next' ? (
                      <Tag color="warning" className="!mr-0">
                        Next up
                      </Tag>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[13px] leading-5 text-slate-500">{step.description}</p>
                </div>
                {step.action ? (
                  <Button
                    type="link"
                    size="small"
                    className="!px-0"
                    onClick={() => navigate(step.action?.path ?? '/dashboard')}
                  >
                    {step.action.label}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title="Your account"
            style={{ borderRadius: 14 }}
            styles={{ body: { padding: 24 } }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <SafetyCertificateOutlined style={{ fontSize: 20 }} />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-500">
                  {user ? getRoleLabel(user.role) : 'Workspace member'}
                </div>
              </div>
            </div>

            <Descriptions
              column={1}
              size="small"
              colon={false}
              items={[
                { key: 'email', label: 'Email', children: user?.email ?? '—' },
                {
                  key: 'created',
                  label: 'Member since',
                  children: user ? dayjs(user.createdAt).format('MMM D, YYYY') : '—',
                },
                { key: 'role', label: 'Access level', children: user ? getRoleLabel(user.role) : '—' },
              ]}
            />

            <Button className="mt-5" block onClick={() => navigate('/settings')}>
              Account settings
            </Button>
          </Card>

          <Card
            title="Operational snapshot"
            style={{ borderRadius: 14 }}
            styles={{ body: { padding: 24 } }}
          >
            <p className="text-[13px] leading-6 text-slate-500">
              Live product counts, low-stock alerts, inventory valuation and movement trends will
              appear here when the reporting dashboard is added.
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-slate-600">
              <li className="flex items-center justify-between gap-3">
                <span>Inventory value</span>
                <Tag className="!mr-0">Phase 4</Tag>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Low-stock alerts</span>
                <Tag className="!mr-0">Phase 4</Tag>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Movement activity</span>
                <Tag className="!mr-0">Phase 4</Tag>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
