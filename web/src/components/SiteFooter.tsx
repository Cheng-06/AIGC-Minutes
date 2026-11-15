import './SiteFooter.css';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>AI 生成内容仅供参考，请人工核对后使用。本地记录只保存在当前浏览器。</p>
        <p className="site-footer-links">
          <span translate="no">AIGC Minutes</span>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/Cheng-06/AIGC-Minutes" target="_blank" rel="noopener noreferrer">
            GitHub 源码
          </a>
        </p>
      </div>
    </footer>
  );
}
