import { NavLink } from 'react-router-dom';
import './SiteHeader.css';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink className="brand" to="/" aria-label="AIGC Minutes 首页">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">AIGC Minutes</span>
        </NavLink>

        <nav className="site-nav" aria-label="主导航">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            首页
          </NavLink>
          <NavLink to="/workspace" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            工作台
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            本地记录
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
