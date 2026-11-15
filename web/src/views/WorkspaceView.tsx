import { App as AntdApp, Button, Skeleton } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import InputPanel from '../components/InputPanel';
import MinutesEditor from '../components/MinutesEditor';
import SourcePanel from '../components/SourcePanel';
import { ApiError, CanceledError } from '../api/http';
import { fetchHealth, generateByFile, generateByText } from '../api/minutes';
import { saveRecord } from '../lib/localMinutes';
import { useMinutesStore } from '../store/minutesStore';
import { buildDemoResult, DEMO_MEETING_TEXT, isDemoMeetingText } from '../data/exampleMeeting';
import type { GenerateInput } from '../types/minutes';
import './WorkspaceView.css';

/** 返回 true 表示等待期间用户点了取消。 */
function waitForDemo(signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 900);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve(true);
      },
      { once: true },
    );
  });
}

export default function WorkspaceView() {
  const { message } = AntdApp.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const minutes = useMinutesStore((state) => state.minutes);
  const source = useMinutesStore((state) => state.source);
  const loading = useMinutesStore((state) => state.loading);
  const error = useMinutesStore((state) => state.error);
  const setResult = useMinutesStore((state) => state.setResult);
  const setRecordId = useMinutesStore((state) => state.setRecordId);
  const setLoading = useMinutesStore((state) => state.setLoading);
  const setError = useMinutesStore((state) => state.setError);
  const setSource = useMinutesStore((state) => state.setSource);

  const [backendReachable, setBackendReachable] = useState(true);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [inputMode, setInputMode] = useState<'input' | 'source'>('input');
  const [demoText, setDemoText] = useState('');
  /** 演示模式：从示例入口进入后等待用户首次生成；它只决定“未配置时能否用内置结果”。 */
  const [demoMode, setDemoMode] = useState(false);
  /** 当前结果是否来自未配置模型时的内置示例，用于在结果上方明确标注。 */
  const [demoFallback, setDemoFallback] = useState(false);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef(false);
  // 同一时间只保留一个生成请求；新请求会中止旧请求，避免两次结果互相覆盖。
  const activeController = useRef<AbortController | null>(null);

  const showSource = inputMode === 'source' && source !== null;
  const inputInitialText = demoText || (source?.kind === 'text' ? source.text : '');

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((health) => {
        if (active) {
          setAiConfigured(health.aiConfigured);
        }
      })
      .catch(() => {
        if (active) {
          setBackendReachable(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('demo') === '1') {
      // 先消费参数，刷新页面时不会重复自动生成。
      setSearchParams({}, { replace: true });
      startDemo();
    }
    // 只在首次挂载时读取一次查询参数。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 结果替换后才聚焦标题，通知读屏；不能依赖输入时的每次重渲染。
  useEffect(() => {
    if (pendingFocus.current && minutes) {
      pendingFocus.current = false;
      resultHeadingRef.current?.focus();
    }
  }, [minutes]);

  /** 进入演示：只填入示例原文，是否生成由用户自己点击。 */
  function startDemo(): void {
    setDemoText(DEMO_MEETING_TEXT);
    setInputMode('input');
    setDemoMode(true);
    setError('');
  }

  /**
   * 未配置模型时的示例体验：加载、取消、元信息、编辑与真实生成保持一致，
   * 只有结果来自内置数据。用户自己输入的原文仍会收到 503，不会被静默替换。
   */
  async function runDemoFallback(): Promise<void> {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    setLoading(true);
    setError('');

    try {
      // 预留可感知的等待，让加载态和取消按钮与真实流程一致。
      if (await waitForDemo(controller.signal)) {
        return;
      }

      const result = buildDemoResult();
      pendingFocus.current = true;
      setResult(result);
      setDemoFallback(true);
      setDemoText('');
      setSource({
        kind: 'text',
        text: DEMO_MEETING_TEXT,
        fileName: null,
        charCount: result.meta.charCount,
      });
      setInputMode('source');
    } finally {
      if (activeController.current === controller) {
        activeController.current = null;
        setLoading(false);
      }
    }
  }

  async function handleGenerate(input: GenerateInput): Promise<void> {
    // 内置结果只对“演示模式 + 未配置模型 + 原文仍是完整示例”生效；
    // 用户改过原文或改用文件时必须走真实请求，避免内置结果冒充生成内容。
    const useDemoResult =
      demoMode && !aiConfigured && input.type === 'text' && isDemoMeetingText(input.text);

    // 首次点击生成即消费演示模式；取消或失败后不会再次自动使用内置结果。
    setDemoMode(false);

    if (useDemoResult) {
      await runDemoFallback();
      return;
    }

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    setLoading(true);
    setError('');

    try {
      const result =
        input.type === 'text'
          ? await generateByText(input.text, controller.signal)
          : await generateByFile(input.file, controller.signal);

      pendingFocus.current = true;
      setResult(result);
      // 真实生成成功后不再展示“内置示例”标注。
      setDemoFallback(false);
      // 示例文本已经进入 source，后续“重新输入”应回落到真实原文。
      setDemoText('');
      setSource({
        kind: input.type,
        text: input.type === 'text' ? input.text : '',
        fileName: input.type === 'file' ? input.file.name : null,
        charCount: result.meta.charCount,
      });
      setInputMode('source');

      // 示例只用于体验，不写入本地记录，避免污染用户自己的纪要列表。
      const isDemoSource = input.type === 'text' && isDemoMeetingText(input.text);
      if (!isDemoSource) {
        const saved = saveRecord(result.minutes);
        if (saved.record) {
          setRecordId(saved.record.id);
        }
        if (saved.error) {
          message.warning(saved.error);
        }
      }
    } catch (requestError) {
      // 主动取消不算失败，也不覆盖上一次的结果与错误提示。
      if (requestError instanceof CanceledError) {
        return;
      }
      setError(requestError instanceof ApiError ? requestError.message : '生成失败，请稍后重试');
    } finally {
      // 旧请求结束时不复位 loading，避免打断正在等待的新请求。
      if (activeController.current === controller) {
        activeController.current = null;
        setLoading(false);
      }
    }
  }

  // 只发取消信号；loading 由请求的 finally 统一复位。
  function handleCancel(): void {
    activeController.current?.abort();
  }

  return (
    <div className="workspace-page">
      <div className="workspace-inner">
        <header className="page-heading">
          <h1>工作台</h1>
          <p>把会议原文整理成可编辑的纪要。先在左侧放入原文，再在右侧逐条校对。</p>
        </header>

        {!backendReachable ? (
          <div className="service-status service-status--error" role="status">
            <span className="service-dot" aria-hidden="true" />
            <p>无法连接后端服务。请确认后端已启动，再刷新页面。</p>
          </div>
        ) : !aiConfigured && !minutes ? (
          <div className="service-status" role="status">
            <span className="service-dot" aria-hidden="true" />
            <p>
              后端尚未配置模型：从示例「体验一下」可查看内置结果；输入自己的原文前，请先配置
              server/.env 中的 LLM 变量并重启。
            </p>
          </div>
        ) : null}

        <div className="workspace-grid">
          <div className="workspace-input">
            {!showSource ? (
              <InputPanel
                loading={loading}
                initialText={inputInitialText}
                onGenerate={(input) => void handleGenerate(input)}
              />
            ) : source ? (
              <SourcePanel source={source} onReinput={() => setInputMode('input')} />
            ) : null}
          </div>

          <section className="workspace-result" aria-labelledby="result-title">
            <header className="result-heading">
              <div>
                <p className="result-eyebrow">OUTPUT</p>
                <h2 id="result-title" ref={resultHeadingRef} className="result-title" tabIndex={-1}>
                  校对与导出
                </h2>
              </div>
              <p className="result-hint">生成后可编辑</p>
            </header>

            {error ? (
              <div className="result-error" role="alert">
                <p>{error}</p>
                {minutes ? (
                  <p className="result-error-note">以下是上一次生成的结果，本次请求没有成功。</p>
                ) : null}
              </div>
            ) : null}

            {demoFallback && !loading && minutes ? (
              <div className="demo-notice" role="status">
                当前未配置模型，下面是内置示例纪要，仅用于体验编辑、复制与导出。配置
                server/.env 后即可生成你自己的纪要。
              </div>
            ) : null}

            {loading ? (
              <div className="result-loading" aria-busy="true">
                <Skeleton active paragraph={{ rows: 6 }} />
                <p className="loading-text" role="status" aria-live="polite">
                  正在整理会议内容，通常需要 10–60 秒……
                </p>
                <Button className="cancel-button" onClick={handleCancel}>
                  取消生成
                </Button>
              </div>
            ) : minutes ? (
              <MinutesEditor />
            ) : (
              <div className="empty-result">
                <span className="empty-kicker">等待生成</span>
                <p className="empty-title">结果会出现在这里</p>
                <p className="empty-copy">先在左侧放入会议原文，生成后可以逐条校对、复制或导出 Word。</p>
                <Button className="demo-button" size="large" onClick={startDemo}>
                  用示例原文试试
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
