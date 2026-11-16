import { api } from './client';
import type { ApiSuccess } from '@/types/api';
import type { AuthResponse, AuthUser } from '@/types/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  return data.data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
  return data.data;
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await api.get<ApiSuccess<AuthUser>>('/auth/me');
  return data.data;
}
