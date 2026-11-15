import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import MinutesPreview from '../components/MinutesPreview';
import './HomeView.css';

function scrollToSteps(event: MouseEvent<HTMLAnchorElement>): void {
  const target = document.getElementById('steps');
  if (!target) {
    return;
  }

  event.preventDefault();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  });
  window.history.replaceState(null, '', '#steps');
}

export default function HomeView() {
  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="home-inner hero-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <span className="hero-eyebrow-dot" aria-hidden="true" />
              AI 会议纪要 · 从原文到行动
            </p>
            <h1 id="hero-title" className="hero-title">
              把会议原文，
              <br />
              整理成能执行的纪要。
            </h1>
            <p className="hero-lede">
              粘贴会议记录，或上传 TXT、DOCX。AI 提取摘要、关键决策和待办，你再校对、复制、导出
              Word。没有提到的负责人和日期，会保持“未明确”，不会替你补全。
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/workspace">
                开始整理会议
              </Link>
              <Link className="text-link" to="/history">
                查看本地记录
              </Link>
            </div>
            <p className="hero-note">无需登录，本地记录只保存在当前浏览器。支持 TXT、DOCX，可导出 Word。</p>
          </div>

          <div className="hero-preview">
            <MinutesPreview />
            <Link className="demo-link" to="/workspace?demo=1">
              体验一下 →
            </Link>
          </div>
        </div>

        <div className="hero-foot">
          <div className="home-inner hero-foot-inner">
            <ul className="hero-facts">
              <li>支持 TXT / DOCX</li>
              <li>摘要 · 决策 · 待办</li>
              <li>可导出 Word</li>
            </ul>
            <a className="scroll-cue" href="#steps" onClick={scrollToSteps}>
              了解工作方式 <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section id="steps" className="steps" aria-labelledby="steps-title">
        <div className="home-inner">
          <div className="section-heading">
            <h2 id="steps-title">从原文到纪要，只要三步</h2>
            <p>不改变你原本的开会方式，只把整理那一步变短。</p>
          </div>

          <ol className="step-list">
            <li>
              <span className="step-number" aria-hidden="true">
                1
              </span>
              <h3>放入原文</h3>
              <p>直接粘贴聊天记录、会议速记，或上传 TXT、DOCX 文件。</p>
            </li>
            <li>
              <span className="step-number" aria-hidden="true">
                2
              </span>
              <h3>生成结构</h3>
              <p>AI 会整理出摘要、关键决策和待办，并在缺失信息处留白。</p>
            </li>
            <li>
              <span className="step-number" aria-hidden="true">
                3
              </span>
              <h3>校对并带走</h3>
              <p>逐条修改，复制为纯文本，或导出 Word 发给需要的人。</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="outputs" aria-labelledby="outputs-title">
        <div className="home-inner">
          <div className="section-heading">
            <h2 id="outputs-title">一份纪要，三个可用的部分</h2>
            <p>结构固定，内容仍然由你判断。</p>
          </div>

          <div className="output-list">
            <article>
              <h3>会议摘要</h3>
              <p>用几句话说明这次会议谈了什么、结论是什么，方便没参会的人快速了解。</p>
            </article>
            <article>
              <h3>关键决策</h3>
              <p>把已经确认的选择单独列出来，避免和讨论过程混在一起。</p>
            </article>
            <article>
              <h3>待办事项</h3>
              <p>任务、负责人、截止时间分列；没有说清楚的就留空，不编造。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="boundary" aria-labelledby="boundary-title">
        <div className="home-inner boundary-inner">
          <div>
            <h2 id="boundary-title">AI 负责整理，判断仍由你完成</h2>
            <p>
              生成的纪要可能存在遗漏或误读。请在导出前核对关键决策、负责人和时间。
              本地记录只保存在当前浏览器，不会上传到服务器。
            </p>
          </div>
          <Link className="button button-primary" to="/workspace">
            整理下一场会议
          </Link>
        </div>
      </section>
    </div>
  );
}
