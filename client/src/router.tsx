import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { CategoriesPage } from '@/pages/catalog/CategoriesPage';
import { ProductsPage } from '@/pages/catalog/ProductsPage';
import { SuppliersPage } from '@/pages/catalog/SuppliersPage';
import { WarehousesPage } from '@/pages/catalog/WarehousesPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { MovementsPage } from '@/pages/inventory/MovementsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';

const routeErrorElement = <RouteErrorPage />;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage />, errorElement: routeErrorElement },
      { path: 'products', element: <ProductsPage />, errorElement: routeErrorElement },
      { path: 'categories', element: <CategoriesPage />, errorElement: routeErrorElement },
      { path: 'inventory', element: <InventoryPage />, errorElement: routeErrorElement },
      { path: 'warehouses', element: <WarehousesPage />, errorElement: routeErrorElement },
      { path: 'suppliers', element: <SuppliersPage />, errorElement: routeErrorElement },
      { path: 'movements', element: <MovementsPage />, errorElement: routeErrorElement },
      { path: 'reports', element: <ReportsPage />, errorElement: routeErrorElement },
      { path: 'settings', element: <SettingsPage />, errorElement: routeErrorElement },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
