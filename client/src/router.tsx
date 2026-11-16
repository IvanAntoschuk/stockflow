import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

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
      {
        path: 'products',
        element: (
          <PlaceholderPage
            title="Products"
            description="Manage SKUs, pricing, categories and stock thresholds."
          />
        ),
      },
      {
        path: 'categories',
        element: (
          <PlaceholderPage
            title="Categories"
            description="Organize the product catalog into reporting-friendly groups."
          />
        ),
      },
      {
        path: 'inventory',
        element: (
          <PlaceholderPage
            title="Inventory"
            description="Review balances and perform stock-in, stock-out, adjustments and transfers."
          />
        ),
      },
      {
        path: 'warehouses',
        element: (
          <PlaceholderPage
            title="Warehouses"
            description="Manage physical locations and the stock held at each one."
          />
        ),
      },
      {
        path: 'suppliers',
        element: (
          <PlaceholderPage
            title="Suppliers"
            description="Keep vendor contact details and product sourcing in one place."
          />
        ),
      },
      {
        path: 'movements',
        element: (
          <PlaceholderPage
            title="Movements"
            description="Inspect the permanent audit trail of every inventory change."
          />
        ),
      },
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
