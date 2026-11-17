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
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from '@/api/suppliers';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { supplierFormSchema, type SupplierFormValues } from '@/lib/validation/catalog';
import type { Supplier } from '@/types/catalog';

const defaults: SupplierFormValues = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

function nullable(value: string | undefined) {
  return value?.trim() || null;
}

export function SuppliersPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [items, setItems] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: defaults,
  });

  const requestKey = `${page}|${pageSize}|${search}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    listSuppliers({ page, pageSize, search: search || undefined })
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

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    reset({
      name: supplier.name,
      contactName: supplier.contactName ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
  }

  async function onSubmit(values: SupplierFormValues) {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        contactName: nullable(values.contactName),
        email: nullable(values.email),
        phone: nullable(values.phone),
        address: nullable(values.address),
        notes: nullable(values.notes),
      };

      if (editing) {
        await updateSupplier(editing.id, payload);
        message.success('Supplier updated');
      } else {
        await createSupplier(payload);
        message.success('Supplier created');
      }

      setDrawerOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier: Supplier) {
    try {
      await deleteSupplier(supplier.id);
      message.success('Supplier deleted');
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  }

  const columns: TableColumnsType<Supplier> = [
    {
      title: 'Supplier',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div className="font-medium text-slate-800">{name}</div>
          {record.contactName ? (
            <div className="text-xs text-slate-500">{record.contactName}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (email: string | null) => (
        <span className="text-slate-600">{email || '—'}</span>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string | null) => (
        <span className="text-slate-600">{phone || '—'}</span>
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
            title="Delete this supplier?"
            description="Suppliers linked to products cannot be deleted."
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
        title="Suppliers"
        description="Keep vendor contacts and product sourcing in one place."
        breadcrumbs={[{ title: 'StockFlow' }, { title: 'Suppliers' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add supplier
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
            placeholder="Search suppliers"
            className="w-full sm:max-w-xs"
          />
        </div>

        <Table<Supplier>
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
            showTotal: (count) => `${count} suppliers`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title={editing ? 'Edit supplier' : 'New supplier'}
        size={screens.md === false ? 360 : 560}
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
              {editing ? 'Save changes' : 'Create supplier'}
            </Button>
          </div>
        }
      >
        <Typography.Paragraph type="secondary" className="!mb-5">
          Add the details you need when placing orders or following up on deliveries.
        </Typography.Paragraph>

        <Form layout="vertical" requiredMark={false}>
          <FormField name="name" label="Supplier name" control={control} required>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="name" placeholder="Northwind Traders" />;
            }}
          </FormField>

          <FormField name="contactName" label="Contact person" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return <Input {...fieldProps} id="contactName" placeholder="Daniel Reyes" />;
            }}
          </FormField>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="email" label="Email" control={control}>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return (
                  <Input
                    {...fieldProps}
                    id="email"
                    type="email"
                    placeholder="orders@supplier.com"
                  />
                );
              }}
            </FormField>

            <FormField name="phone" label="Phone" control={control}>
              {(field) => {
                const { ref: _ref, ...fieldProps } = field;
                return <Input {...fieldProps} id="phone" placeholder="+1 555 000 0000" />;
              }}
            </FormField>
          </div>

          <FormField name="address" label="Address" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return (
                <Input.TextArea
                  {...fieldProps}
                  id="address"
                  rows={2}
                  placeholder="Street, city, state"
                />
              );
            }}
          </FormField>

          <FormField name="notes" label="Notes" control={control}>
            {(field) => {
              const { ref: _ref, ...fieldProps } = field;
              return (
                <Input.TextArea
                  {...fieldProps}
                  id="notes"
                  rows={3}
                  placeholder="Payment terms, lead times, special instructions"
                />
              );
            }}
          </FormField>
        </Form>
      </Drawer>
    </>
  );
}
