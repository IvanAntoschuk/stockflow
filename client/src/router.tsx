import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { CategoriesPage } from '@/pages/catalog/CategoriesPage';
import { ProductsPage } from '@/pages/catalog/ProductsPage';
import { SuppliersPage } from '@/pages/catalog/SuppliersPage';
import { WarehousesPage } from '@/pages/catalog/WarehousesPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { MovementsPage } from '@/pages/inventory/MovementsPage';

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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'warehouses', element: <WarehousesPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'movements', element: <MovementsPage /> },
      {
        path: 'reports',
        element: (
          <PlaceholderPage
            title="Reports"
            description="Review inventory valuation, stock alerts and movement history."
          />
        ),
      },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
