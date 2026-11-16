import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, App, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { register } from '@/features/auth/authSlice';
import { registerSchema, type RegisterFormValues } from '@/lib/validation/auth';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const result = await dispatch(
        register({ name: values.name, email: values.email, password: values.password }),
      ).unwrap();
      message.success(`Your workspace account for ${result.user.email} is ready`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(
        typeof error === 'string' ? error : 'Unable to create your account. Please try again.',
      );
    }
  }

  return (
    <AuthShell
      title="Create your StockFlow account"
      subtitle="Set up access to your warehouse network in less than a minute."
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            Sign in
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
        <FormField name="name" label="Full name" control={control} required>
          {(field) => {
            const { ref: _ref, ...fieldProps } = field;
            return (
              <Input
                {...fieldProps}
                id="name"
                size="large"
                prefix={<UserOutlined className="text-slate-400" />}
                placeholder="Alex Morgan"
                autoComplete="name"
              />
            );
          }}
        </FormField>

        <FormField name="email" label="Work email" control={control} required>
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

        <FormField
          name="password"
          label="Password"
          control={control}
          required
          extra="At least 8 characters, with a letter and a number."
        >
          {(field) => {
            const { ref: _ref, ...fieldProps } = field;
            return (
              <Input.Password
                {...fieldProps}
                id="password"
                size="large"
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Create a password"
                autoComplete="new-password"
              />
            );
          }}
        </FormField>

        <FormField name="confirmPassword" label="Confirm password" control={control} required>
          {(field) => {
            const { ref: _ref, ...fieldProps } = field;
            return (
              <Input.Password
                {...fieldProps}
                id="confirmPassword"
                size="large"
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            );
          }}
        </FormField>

        <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
          Create account
        </Button>
      </Form>
    </AuthShell>
  );
}
