import { Breadcrumb, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb
          className="mb-3"
          style={{ fontSize: 12 }}
          items={breadcrumbs.map((item) => ({
            title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title,
          }))}
        />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Typography.Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph
              type="secondary"
              style={{ margin: '6px 0 0', marginBottom: 0, maxWidth: 720 }}
            >
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
