import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, App, Button, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { login } from '@/features/auth/authSlice';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as LoginLocationState | null)?.from?.pathname ?? '/dashboard';

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const result = await dispatch(login(values)).unwrap();
      message.success(`Welcome back, ${result.user.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(
        typeof error === 'string' ? error : 'Unable to sign in. Please try again.',
      );
    }
  }

  return (
    <AuthShell
      title="Sign in to StockFlow"
      subtitle="Welcome back. Enter your credentials to access your inventory workspace."
      footer={
        <span>
          New to StockFlow?{' '}
          <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            Create an account
          </Link>
        </span>
      }
    >
      {serverError ? (
        <Alert
          type="error"
          showIcon
          message={serverError}
          closable
          onClose={() => setServerError(null)}
          className="mb-5"
        />
      ) : null}

      <Form
        layout="vertical"
        requiredMark={false}
        onFinish={() => {
          void handleSubmit(onSubmit)();
        }}
      >
        <FormField name="email" label="Email address" control={control} required>
          {(field) => {
            const { ref: _ref, ...fieldProps } = field;
            return (
              <Input
                {...fieldProps}
                id="email"
                size="large"
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="you@company.com"
                autoComplete="email"
                inputMode="email"
              />
            );
          }}
        </FormField>

        <FormField name="password" label="Password" control={control} required>
          {(field) => {
            const { ref: _ref, ...fieldProps } = field;
            return (
              <Input.Password
                {...fieldProps}
                id="password"
                size="large"
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            );
          }}
        </FormField>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={isSubmitting}
          style={{ marginTop: 4 }}
        >
          Sign in
        </Button>
      </Form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography.Text strong className="!text-[12px] !uppercase !tracking-wide !text-slate-500">
              Demo account
            </Typography.Text>
            <div className="mt-1 text-[13px] text-slate-600">
              admin@stockflow.dev · Admin123!
            </div>
          </div>
          <Button
            type="link"
            size="small"
            className="!px-0"
            onClick={() => {
              setValue('email', 'admin@stockflow.dev', { shouldValidate: true });
              setValue('password', 'Admin123!', { shouldValidate: true });
            }}
          >
            Use demo credentials
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
