import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { antdTheme } from './styles/antdTheme';
import './styles/tokens.css';
import './styles/main.css';

// DatePicker 的月份/星期文案来自 dayjs locale，需要与 antd 的 zh_CN 一起设置。
dayjs.locale('zh-cn');

const container = document.getElementById('root');
if (!container) {
  throw new Error('找不到根节点 #root');
}

createRoot(container).render(
  <ConfigProvider theme={antdTheme} locale={zhCN}>
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>
  </ConfigProvider>,
);
