import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router-dom';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import './App.css';

interface RouteHandle {
  title?: string;
}

/** 路由切换时更新页面标题。 */
function useDocumentTitle(): void {
  const matches = useMatches();

  useEffect(() => {
    const lastWithTitle = [...matches]
      .reverse()
      .find((match) => (match.handle as RouteHandle | undefined)?.title);

    const title = (lastWithTitle?.handle as RouteHandle | undefined)?.title;
    if (title) {
      document.title = title;
    }
  }, [matches]);
}

/** 进入新页面回到顶部；带 hash 时滚动到对应区块。 */
function useScrollRestoration(): void {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target instanceof HTMLElement) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
}

export default function App() {
  useDocumentTitle();
  useScrollRestoration();

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <SiteHeader />

      <main id="main" className="app-main" tabIndex={-1}>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
