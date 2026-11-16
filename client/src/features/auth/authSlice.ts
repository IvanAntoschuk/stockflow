import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginRequest, meRequest, registerRequest } from '@/api/auth';
import { getApiErrorMessage, tokenStorage } from '@/api/client';
import type { AuthResponse, AuthUser } from '@/types/auth';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: tokenStorage.get(),
  status: 'idle',
  initialized: false,
  error: null,
};

export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (input, { rejectWithValue }) => {
  try {
    return await loginRequest(input);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const register = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async (input, { rejectWithValue }) => {
  try {
    return await registerRequest(input);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const loadSession = createAsyncThunk<AuthUser | null, void, { rejectValue: string }>(
  'auth/loadSession',
  async (_, { rejectWithValue }) => {
    if (!tokenStorage.get()) {
      return null;
    }

    try {
      return await meRequest();
    } catch (error) {
      tokenStorage.clear();
      return rejectWithValue(getApiErrorMessage(error));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      tokenStorage.clear();
      state.user = null;
      state.token = null;
      state.status = 'unauthenticated';
      state.initialized = true;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        tokenStorage.set(action.payload.token);
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
        state.initialized = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.initialized = true;
        state.error = action.payload ?? 'Unable to sign in';
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        tokenStorage.set(action.payload.token);
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
        state.initialized = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.initialized = true;
        state.error = action.payload ?? 'Unable to create your account';
      })
      .addCase(loadSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.initialized = true;
        state.error = null;

        if (action.payload) {
          state.user = action.payload;
          state.token = tokenStorage.get();
          state.status = 'authenticated';
        } else {
          state.user = null;
          state.token = null;
          state.status = 'unauthenticated';
        }
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.status = 'unauthenticated';
        state.error = action.payload ?? null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
