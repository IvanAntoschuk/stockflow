import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

function FullScreenLoader() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f5f6f7]">
      <Spin size="large" />
      <span className="text-sm text-slate-500">Loading your workspace…</span>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { initialized, status } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized || status === 'loading') {
    return <FullScreenLoader />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { initialized, status } = useAppSelector((state) => state.auth);

  if (!initialized || status === 'loading') {
    return <FullScreenLoader />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
