import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import HomeView from '../views/HomeView';

// 工作台与本地记录按需加载，保持原有的路由级代码分割。
const WorkspaceView = lazy(() => import('../views/WorkspaceView'));
const HistoryView = lazy(() => import('../views/HistoryView'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomeView />,
        handle: { title: 'AIGC Minutes｜把会议原文变成可执行的纪要' },
      },
      {
        path: 'workspace',
        element: <WorkspaceView />,
        handle: { title: '工作台｜AIGC Minutes' },
      },
      {
        path: 'history',
        element: <HistoryView />,
        handle: { title: '本地记录｜AIGC Minutes' },
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
