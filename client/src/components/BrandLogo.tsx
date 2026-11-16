import { InboxOutlined } from '@ant-design/icons';

interface BrandLogoProps {
  variant?: 'default' | 'light';
}

export function BrandLogo({ variant = 'default' }: BrandLogoProps) {
  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-3">
      <span
        className={
          isLight
            ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15'
            : 'flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm'
        }
      >
        <InboxOutlined style={{ fontSize: 18 }} />
      </span>
      <span className="leading-none">
        <span
          className={
            isLight
              ? 'block text-[15px] font-semibold tracking-tight text-white'
              : 'block text-[15px] font-semibold tracking-tight text-slate-900'
          }
        >
          StockFlow
        </span>
        <span
          className={
            isLight
              ? 'mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200/70'
              : 'mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400'
          }
        >
          Inventory OS
        </span>
      </span>
    </div>
  );
}
