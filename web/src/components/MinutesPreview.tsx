import './MinutesPreview.css';

export default function MinutesPreview() {
  return (
    <figure className="minutes-preview">
      <div className="preview-window">
        <div className="preview-toolbar">
          <div className="preview-file">
            <span className="preview-file-icon" aria-hidden="true" />
            <span>产品周会.txt</span>
          </div>
          <span className="preview-chip">示例</span>
        </div>

        <div className="preview-body">
          <section className="preview-pane preview-source" aria-label="会议原文示例">
            <p className="preview-label">会议原文</p>
            <p className="preview-quote">
              “本周确认首页改版范围，下周三前完成验收；数据看板先不动，等下一轮再排。”
            </p>
            <p className="preview-source-note">原文只用于本次整理，不会写入本地记录。</p>
          </section>

          <section className="preview-pane preview-result" aria-label="整理后的纪要示例">
            <div className="preview-result-head">
              <p className="preview-doc-title">产品周会纪要</p>
              <span className="preview-status">
                <span className="preview-status-dot" aria-hidden="true" />
                AI 整理
              </span>
            </div>
            <p className="preview-summary">
              会议确认了首页改版的交付范围，并决定本轮不启动数据看板。
            </p>

            <div className="preview-block">
              <p className="preview-label">关键决策</p>
              <p>首页改版按现有范围推进，数据看板延后。</p>
            </div>

            <div className="preview-block">
              <p className="preview-label">待办事项</p>
              <ul className="preview-todos">
                <li>
                  <span className="preview-todo-task">完成首页改版验收</span>
                  <span className="preview-meta">负责人：未明确 · 截止：未明确</span>
                </li>
                <li>
                  <span className="preview-todo-task">整理下一轮数据看板需求</span>
                  <span className="preview-meta">负责人：未明确 · 截止：未明确</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className="preview-footer">
          <span>摘要 · 关键决策 · 待办</span>
          <span>缺失信息保持“未明确”</span>
        </div>
      </div>

      <figcaption>示例：负责人和日期不明确时保持“未明确”，不会自动补全。</figcaption>
    </figure>
  );
}
