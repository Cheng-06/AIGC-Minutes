import type { SourceSnapshot } from '../types/minutes';
import './SourcePanel.css';

interface SourcePanelProps {
  source: SourceSnapshot;
  onReinput: () => void;
}

export default function SourcePanel({ source, onReinput }: SourcePanelProps) {
  return (
    <section className="source-panel" aria-labelledby="source-title">
      <div className="source-heading">
        <div>
          <h2 id="source-title">原文参考</h2>
          <p className="source-meta">
            {source.kind === 'text' ? '粘贴文本' : '上传文件'} · 约{' '}
            {source.charCount.toLocaleString('zh-CN')} 字符
          </p>
        </div>
        <button type="button" className="source-reinput" onClick={onReinput}>
          重新输入
        </button>
      </div>

      {source.kind === 'text' ? (
        <pre className="source-text" tabIndex={0} aria-label="会议原文内容，可滚动查看">
          {source.text}
        </pre>
      ) : (
        <div className="source-file">
          <span className="source-file-label">文件</span>
          <span className="source-file-name" translate="no">
            {source.fileName ?? '未命名文件'}
          </span>
          <p>文件内容只在本次生成时读取，不会写入本地记录。</p>
        </div>
      )}

      <p className="source-note">原文仅用于本次生成；本地记录不保存原文。</p>
    </section>
  );
}
