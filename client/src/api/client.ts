import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse, ApiSuccess, Paginated, ValidationIssue } from '@/types/api';

const TOKEN_KEY = 'stockflow.token';

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const requestUrl = error.config?.url ?? '';
    const isAuthAttempt =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthAttempt && tokenStorage.get()) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ValidationIssue).message === 'string'
  );
}

export async function getPaginated<T>(url: string, params?: object): Promise<Paginated<T>> {
  const { data } = await api.get<ApiSuccess<T[]>>(url, { params });
  return {
    items: data.data,
    meta: data.meta ?? {
      page: 1,
      pageSize: data.data.length,
      total: data.data.length,
      totalPages: data.data.length > 0 ? 1 : 0,
    },
  };
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const payload = error.response?.data;
    if (payload?.success === false) {
      const details = payload.error.details;
      if (Array.isArray(details) && details.length > 0 && isValidationIssue(details[0])) {
        return details[0].message;
      }
      return payload.error.message;
    }
    return error.message || 'Unable to reach the server';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
