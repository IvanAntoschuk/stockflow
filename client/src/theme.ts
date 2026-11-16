import type { ThemeConfig } from 'antd';

const fontFamily =
  "'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#059669',
    colorInfo: '#059669',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorTextBase: '#1f2937',
    colorBgLayout: '#f5f6f7',
    colorBgContainer: '#ffffff',
    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#eef0f3',
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily,
    fontSize: 14,
    controlHeight: 38,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#f5f6f7',
    },
    Menu: {
      itemHeight: 42,
      itemBorderRadius: 8,
      itemMarginBlock: 2,
      itemSelectedBg: '#ecfdf5',
      itemSelectedColor: '#047857',
      itemHoverBg: '#f5f7f6',
      itemColor: '#475569',
    },
    Table: {
      headerBg: '#f9fafb',
      headerColor: '#475569',
      rowHoverBg: '#f9fafb',
      borderColor: '#eef0f3',
    },
    Button: {
      fontWeight: 500,
      primaryShadow: 'none',
    },
    Card: {
      headerHeight: 52,
    },
    Statistic: {
      contentFontSize: 28,
    },
  },
};
