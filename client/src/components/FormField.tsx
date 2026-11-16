import { Form } from 'antd';
import type { ReactNode } from 'react';
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from 'react-hook-form';

interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  required?: boolean;
  extra?: ReactNode;
  children: (field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>) => ReactNode;
}

export function FormField<TFieldValues extends FieldValues>({
  name,
  label,
  control,
  required,
  extra,
  children,
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Form.Item
          label={label}
          htmlFor={name}
          required={required}
          validateStatus={fieldState.error ? 'error' : undefined}
          help={fieldState.error?.message}
          extra={extra}
        >
          {children(field)}
        </Form.Item>
      )}
    />
  );
}
