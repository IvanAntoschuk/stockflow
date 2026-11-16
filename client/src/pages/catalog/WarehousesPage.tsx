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
import { getApiErrorMessage } from '@/api/client';
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
} from '@/api/warehouses';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { warehouseFormSchema, type WarehouseFormValues } from '@/lib/validation/catalog';
import type { Warehouse } from '@/types/catalog';

const defaults: WarehouseFormValues = { name: '', code: '', city: '', address: '' };

function nullable(value: string | undefined) {
  return value?.trim() || null;
}

export function WarehousesPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [items, setItems] = useState<Warehouse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: defaults,
  });

  const requestKey = `${page}|${pageSize}|${search}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    listWarehouses({ page, pageSize, search: search || undefined })
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

  function openEdit(warehouse: Warehouse) {
    setEditing(warehouse);
    reset({
      name: warehouse.name,
      code: warehouse.code,
      city: warehouse.city ?? '',
      address: warehouse.address ?? '',
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
  }

  async function onSubmit(values: WarehouseFormValues) {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        code: values.code,
        city: nullable(values.city),
        address: nullable(values.address),
      };

      if (editing) {
        await updateWarehouse(editing.id, payload);
        message.success('Warehouse updated');
      } else {
        await createWarehouse(payload);
        message.success('Warehouse created');
      }

      setDrawerOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(warehouse: Warehouse) {
    try {
      await deleteWarehouse(warehouse.id);
      message.success('Warehouse deleted');
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  }

  const columns: TableColumnsType<Warehouse> = [
    {
      title: 'Warehouse',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium text-slate-800">{name}</span>,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Tag color="green">{code}</Tag>,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 170,
      render: (city: string | null) => <span className="text-slate-600">{city || '—'}</span>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address: string | null) => (
        <span className="text-slate-500">{address || '—'}</span>
      ),
    },
    {
      title: 'Inventory records',
      dataIndex: 'inventoryCount',
      key: 'inventoryCount',
      width: 160,
      render: (count: number) => <Tag>{count}</Tag>,
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
            title="Delete this warehouse?"
            description="Warehouses that hold inventory records cannot be deleted."
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
        title="Warehouses"
        description="Manage physical locations and the stock held at each one."
        breadcrumbs={[{ title: 'StockFlow' }, { title: 'Warehouses' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add warehouse
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
            placeholder="Search warehouses"
            className="w-full sm:max-w-xs"
          />
        </div>

        <Table<Warehouse>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} warehouses`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title={editing ? 'Edit warehouse' : 'New warehouse'}
        size={screens.md === false ? 360 : 520}
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
              {editing ? 'Save changes' : 'Create warehouse'}
            </Button>
          </div>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5">
          Use a short code that warehouse staff can recognize quickly.
        </Typography.Paragraph>

        <Form layout="vertical" requiredMark={false}>
          <FormField name="name" label="Warehouse name" control={control} required>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="name" placeholder="Main Warehouse" />;
            }}
          </FormField>

          <FormField name="code" label="Code" control={control} required>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="code" placeholder="MAIN" />;
            }}
          </FormField>

          <FormField name="city" label="City" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="city" placeholder="Portland, OR" />;
            }}
          </FormField>

          <FormField name="address" label="Address" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return (
                <Input.TextArea
                  {...fieldProps}
                  id="address"
                  rows={3}
                  placeholder="1200 Distribution Way"
                />
              );
            }}
          </FormField>
        </Form>
      </Drawer>
    </>
  );
}
