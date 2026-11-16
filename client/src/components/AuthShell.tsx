import { CheckCircleFilled } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const highlights = [
  'One source of truth for every warehouse balance',
  'Audit-ready stock movements with full history',
  'Low-stock and valuation insight built in',
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[#f5f6f7]">
      <aside className="relative hidden w-[46%] min-w-[420px] flex-col justify-between overflow-hidden bg-[#0c2a22] px-12 py-12 lg:flex xl:px-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 18%, rgba(16,185,129,0.30), transparent 42%), radial-gradient(circle at 82% 78%, rgba(52,211,153,0.16), transparent 40%)',
          }}
        />
        <div className="relative">
          <BrandLogo variant="light" />
          <h1 className="mt-16 max-w-[460px] text-[38px] font-semibold leading-[1.15] tracking-tight text-white">
            Inventory clarity for growing operations.
          </h1>
          <p className="mt-4 max-w-[440px] text-[15px] leading-7 text-emerald-50/70">
            Track stock across every warehouse, keep an audit-ready movement trail, and act
            before shelves run empty.
          </p>
          <ul className="mt-10 space-y-4">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-sm text-emerald-50/85">
                <CheckCircleFilled className="mt-0.5 text-emerald-400" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative border-t border-white/10 pt-6 text-xs text-emerald-100/50">
          Multi-warehouse inventory · Transaction-safe stock movements · Audit history
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-slate-500">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
