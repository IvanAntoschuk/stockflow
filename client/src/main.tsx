import '@fontsource-variable/inter';
import { App as AntdApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { setUnauthorizedHandler } from '@/api/client';
import { store } from '@/app/store';
import { loadSession, logout } from '@/features/auth/authSlice';
import { router } from '@/router';
import { themeConfig } from '@/theme';
import './index.css';

setUnauthorizedHandler(() => {
  store.dispatch(logout());
});
void store.dispatch(loadSession());

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={themeConfig} locale={enUS}>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </Provider>
  </StrictMode>,
);
