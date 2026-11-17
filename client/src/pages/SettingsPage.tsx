import { LogoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Popconfirm, Tag } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { PageHeader } from '@/components/PageHeader';
import { logout } from '@/features/auth/authSlice';
import { getRoleLabel } from '@/lib/labels';

export function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();

  function handleLogout() {
    dispatch(logout());
    message.success('Signed out of StockFlow');
    navigate('/login', { replace: true });
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your StockFlow account and session."
        breadcrumbs={[{ title: 'StockFlow', href: '/dashboard' }, { title: 'Settings' }]}
      />

      <div className="max-w-3xl space-y-6">
        <Card title="Profile" style={{ borderRadius: 14 }} styles={{ body: { padding: 24 } }}>
          <Descriptions
            column={1}
            colon={false}
            items={[
              { key: 'name', label: 'Full name', children: user?.name ?? '—' },
              { key: 'email', label: 'Email', children: user?.email ?? '—' },
              {
                key: 'role',
                label: 'Access level',
                children: user ? <Tag color="green">{getRoleLabel(user.role)}</Tag> : '—',
              },
              {
                key: 'member',
                label: 'Member since',
                children: user ? dayjs(user.createdAt).format('MMMM D, YYYY') : '—',
              },
            ]}
          />
        </Card>

        <Card
          title="Session & security"
          style={{ borderRadius: 14 }}
          styles={{ body: { padding: 24 } }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <SafetyCertificateOutlined />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-800">Access token active</div>
                <p className="mt-1 max-w-md text-[13px] leading-5 text-slate-500">
                  Your session is protected by a signed JWT and expires automatically. Signing out
                  removes the token from this browser.
                </p>
              </div>
            </div>
            <Popconfirm
              title="Sign out of StockFlow?"
              description="You will need to sign in again to access the workspace."
              okText="Sign out"
              cancelText="Stay signed in"
              okButtonProps={{ danger: true }}
              onConfirm={handleLogout}
            >
              <Button danger icon={<LogoutOutlined />}>
                Sign out
              </Button>
            </Popconfirm>
          </div>
        </Card>
      </div>
    </>
  );
}
