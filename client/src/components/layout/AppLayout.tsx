import {
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Grid,
  Input,
  Layout,
  Menu,
  Popover,
  Tag,
  Tooltip,
  type MenuProps,
} from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { BrandLogo } from '@/components/BrandLogo';
import { navItems } from '@/components/layout/navigation';
import { logout } from '@/features/auth/authSlice';
import { getRoleLabel } from '@/lib/labels';

const { Header, Sider, Content } = Layout;

function getInitials(name: string | undefined) {
  if (!name) return 'SF';
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'SF'
  );
}

export function AppLayout() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.lg !== false;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedKey =
    navItems.find(
      (item) =>
        location.pathname === `/${item.key}` || location.pathname.startsWith(`/${item.key}/`),
    )?.key ?? 'dashboard';

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', label: 'Account settings', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Sign out', icon: <LogoutOutlined />, danger: true },
  ];

  function handleUserMenu({ key }: { key: string }) {
    if (key === 'settings') {
      navigate('/settings');
      return;
    }

    if (key === 'logout') {
      dispatch(logout());
      message.success('Signed out of StockFlow');
      navigate('/login', { replace: true });
    }
  }

  function submitSearch() {
    const value = search.trim();
    if (!value) return;
    navigate(`/products?search=${encodeURIComponent(value)}`);
    setSearch('');
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center px-5">
        <BrandLogo />
      </div>
      <div className="px-3 pb-4">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems as MenuProps['items']}
          onClick={({ key }) => {
            setDrawerOpen(false);
            navigate(`/${key}`);
          }}
          style={{ borderInlineEnd: 'none', background: 'transparent' }}
        />
      </div>
      <div className="mt-auto px-4 pb-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Workspace
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[13px] font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Main warehouse network
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-400">StockFlow v1.0</div>
      </div>
    </div>
  );

  const notifications = (
    <div className="w-[290px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-sm font-semibold text-slate-800">Notifications</span>
        <Tag color="default" className="!m-0">
          Alerts
        </Tag>
      </div>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<span className="text-xs text-slate-500">No notifications right now</span>}
        className="!my-3"
      />
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {isDesktop ? (
        <Sider
          width={248}
          theme="light"
          style={{
            borderRight: '1px solid #e9edf1',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          {sidebar}
        </Sider>
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          size={268}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          {sidebar}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e9edf1',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          {!isDesktop ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            />
          ) : null}

          <div className="min-w-0 flex-1 sm:max-w-md">
            <Input
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={submitSearch}
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search products or SKU…"
              aria-label="Search products"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Popover content={notifications} trigger="click" placement="bottomRight">
              <Tooltip title="Notifications">
                <Badge dot={false}>
                  <Button type="text" icon={<BellOutlined />} aria-label="Notifications" />
                </Badge>
              </Tooltip>
            </Popover>

            <Divider orientation="vertical" className="!mx-1 !h-6" />

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              trigger={['click']}
              placement="bottomRight"
            >
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                aria-label="Open user menu"
              >
                <Avatar
                  size={32}
                  style={{ backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 600 }}
                >
                  {getInitials(user?.name)}
                </Avatar>
                <span className="hidden text-left md:block">
                  <span className="block text-[13px] font-medium leading-4 text-slate-800">
                    {user?.name}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {user ? getRoleLabel(user.role) : ''}
                  </span>
                </span>
                <DownOutlined className="hidden text-[10px] text-slate-400 md:inline" />
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
