import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ShopOutlined,
  SwapOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: 'products', label: 'Products', icon: <AppstoreOutlined /> },
  { key: 'categories', label: 'Categories', icon: <TagsOutlined /> },
  { key: 'inventory', label: 'Inventory', icon: <DatabaseOutlined /> },
  { key: 'warehouses', label: 'Warehouses', icon: <BankOutlined /> },
  { key: 'suppliers', label: 'Suppliers', icon: <ShopOutlined /> },
  { key: 'movements', label: 'Movements', icon: <SwapOutlined /> },
  { key: 'reports', label: 'Reports', icon: <BarChartOutlined /> },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
];
