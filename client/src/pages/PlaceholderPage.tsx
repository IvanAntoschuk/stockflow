import { Empty, Card } from 'antd';
import { PageHeader } from '@/components/PageHeader';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ title: 'StockFlow', href: '/dashboard' }, { title }]}
      />
      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 48 } }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-sm text-slate-500">
              This module is ready for data. Records will appear here as your workspace grows.
            </span>
          }
        />
      </Card>
    </>
  );
}
