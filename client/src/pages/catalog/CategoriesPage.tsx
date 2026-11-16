import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Grid,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/api/categories';
import { getApiErrorMessage } from '@/api/client';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { formatDate } from '@/lib/format';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/validation/catalog';
import type { Category } from '@/types/catalog';

const defaults: CategoryFormValues = { name: '', description: '' };

export function CategoriesPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [items, setItems] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaults,
  });

  const requestKey = `${page}|${pageSize}|${search}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    listCategories({ page, pageSize, search: search || undefined })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.meta.total);
        setLoadedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (active) {
          message.error(getApiErrorMessage(error));
          setLoadedKey(requestKey);
        }
      });

    return () => {
      active = false;
    };
  }, [message, page, pageSize, reloadKey, requestKey, search]);

  function openCreate() {
    setEditing(null);
    reset(defaults);
    setDrawerOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    reset({ name: category.name, description: category.description ?? '' });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
  }

  async function onSubmit(values: CategoryFormValues) {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description?.trim() || null,
      };

      if (editing) {
        await updateCategory(editing.id, payload);
        message.success('Category updated');
      } else {
        await createCategory(payload);
        message.success('Category created');
      }

      setDrawerOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    try {
      await deleteCategory(category.id);
      message.success('Category deleted');
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  }

  const columns: TableColumnsType<Category> = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium text-slate-800">{name}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) => (
        <span className="text-slate-500">{description || '—'}</span>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 110,
      render: (count: number) => <Tag>{count}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this category?"
            description="Categories linked to products cannot be deleted."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => void handleDelete(record)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products into reporting-friendly categories."
        breadcrumbs={[{ title: 'StockFlow' }, { title: 'Categories' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add category
          </Button>
        }
      />

      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 20 } }}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input.Search
            allowClear
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search categories"
            className="w-full sm:max-w-xs"
          />
        </div>

        <Table<Category>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 850 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} categories`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title={editing ? 'Edit category' : 'New category'}
        size={screens.md === false ? 360 : 480}
        open={drawerOpen}
        onClose={closeDrawer}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeDrawer} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={saving || isSubmitting}
              onClick={() => void handleSubmit(onSubmit)()}
            >
              {editing ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5">
          Keep category names short and distinct so products stay easy to filter.
        </Typography.Paragraph>

        <Form layout="vertical" requiredMark={false}>
          <FormField name="name" label="Name" control={control} required>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="name" placeholder="Office Supplies" />;
            }}
          </FormField>

          <FormField name="description" label="Description" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return (
                <Input.TextArea
                  {...fieldProps}
                  id="description"
                  rows={3}
                  placeholder="What belongs in this category?"
                />
              );
            }}
          </FormField>
        </Form>
      </Drawer>
    </>
  );
}
