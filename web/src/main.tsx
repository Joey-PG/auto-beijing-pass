import 'antd/dist/reset.css';
import './styles.css';

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          borderRadius: 6,
          colorBgLayout: '#f5f7fa',
          colorBorderSecondary: '#edf0f5',
          colorPrimary: '#2f6bff',
          colorText: '#172033',
          colorTextSecondary: '#667085',
          fontFamily:
            '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
          fontSize: 14,
        },
        components: {
          Button: { controlHeight: 38 },
          Card: { paddingLG: 20 },
          Layout: { bodyBg: '#f5f7fa', headerBg: '#ffffff', siderBg: '#071d35' },
          Table: { headerBg: '#fafbfc', headerColor: '#475467', rowHoverBg: '#f5f8ff' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
