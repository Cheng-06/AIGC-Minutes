import { App as AntdApp, Button, DatePicker, Input, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { ApiError } from '../api/http';
import { exportMinutes } from '../api/minutes';
import { saveRecord } from '../lib/localMinutes';
import { useMinutesStore } from '../store/minutesStore';
import {
  MAX_DECISION_LENGTH,
  MAX_DECISIONS,
  MAX_OWNER_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_TODO_TASK_LENGTH,
  MAX_TODOS,
} from '../constants';
import type { Minutes, TodoItem } from '../types/minutes';
import { copyText } from '../utils/clipboard';
import { confirmAction } from '../utils/confirm';
import { buildExportFileName, downloadBlob } from '../utils/download';
import { formatMinutesText } from '../utils/formatMinutes';
import './MinutesEditor.css';

const FIELD_LABELS: Array<[string, string]> = [
  ['minutes.title', '标题'],
  ['minutes.summary', '会议摘要'],
  ['minutes.decisions', '关键决策'],
  ['minutes.todos', '待办事项'],
];

/** 把后端 details 里的字段路径翻译成界面用语，避免只给一句“导出参数不合法”。 */
function describeExportError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return '导出失败，请稍后重试';
  }

  const details = error.details
    .slice(0, 3)
    .map((item) => {
      const label = FIELD_LABELS.find(
        ([path]) => item.path === path || item.path.startsWith(`${path}.`),
      )?.[1];
      return label ? `${label}：${item.message}` : item.message;
    })
    .join('；');

  return details ? `${error.message}（${details}）` : error.message;
}

export default function MinutesEditor() {
  const { message, modal } = AntdApp.useApp();
  const storedMinutes = useMinutesStore((state) => state.minutes);
  const meta = useMinutesStore((state) => state.meta);
  const dirty = useMinutesStore((state) => state.dirty);
  const recordId = useMinutesStore((state) => state.recordId);
  const markSaved = useMinutesStore((state) => state.markSaved);
  const setRecordId = useMinutesStore((state) => state.setRecordId);
  const updateMinutes = useMinutesStore((state) => state.updateMinutes);

  const [exporting, setExporting] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  if (!storedMinutes) {
    return null;
  }

  // 收窄成非空类型，供下方的事件回调与列表渲染复用。
  const minutes = storedMinutes;

  const statusText = dirty ? '有未保存修改' : recordId ? '已保存到本地' : '已生成';

  function updateTodo(index: number, patch: Partial<TodoItem>): void {
    updateMinutes((current) => ({
      ...current,
      todos: current.todos.map((todo, todoIndex) =>
        todoIndex === index ? { ...todo, ...patch } : todo,
      ),
    }));
  }

  function addDecision(): void {
    if (minutes.decisions.length >= MAX_DECISIONS) {
      message.warning(`关键决策最多 ${MAX_DECISIONS} 条`);
      return;
    }
    updateMinutes((current) => ({ ...current, decisions: [...current.decisions, ''] }));
  }

  function removeDecision(index: number): void {
    updateMinutes((current) => ({
      ...current,
      decisions: current.decisions.filter((_, decisionIndex) => decisionIndex !== index),
    }));
  }

  function addTodo(): void {
    if (minutes.todos.length >= MAX_TODOS) {
      message.warning(`待办事项最多 ${MAX_TODOS} 条`);
      return;
    }
    updateMinutes((current) => ({
      ...current,
      todos: [...current.todos, { task: '', owner: '', dueDate: '' }],
    }));
  }

  async function removeTodo(index: number): Promise<void> {
    const todo = minutes.todos[index];
    if (!todo) {
      return;
    }

    const confirmed = await confirmAction(modal, {
      title: '删除待办',
      content: `确定删除“${todo.task.trim() || '未命名待办'}”吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    updateMinutes((current) => ({
      ...current,
      todos: current.todos.filter((_, todoIndex) => todoIndex !== index),
    }));
    setLiveMessage('已删除该条待办');
  }

  async function handleCopy(): Promise<void> {
    try {
      await copyText(formatMinutesText(minutes));
      setLiveMessage('已复制到剪贴板');
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  }

  /** 导出前先在前端做一次轻量校验，避免把明显不合法的内容发给后端。 */
  async function handleExport(): Promise<void> {
    if (!minutes.summary.trim()) {
      message.warning('请先填写会议摘要');
      return;
    }

    // 历史记录可能由旧版本写入，条数仍可能超出上限，导出前再拦一次。
    if (minutes.decisions.length > MAX_DECISIONS) {
      message.warning(`关键决策最多 ${MAX_DECISIONS} 条，请先删减`);
      return;
    }

    if (minutes.todos.length > MAX_TODOS) {
      message.warning(`待办事项最多 ${MAX_TODOS} 条，请先删减`);
      return;
    }

    const emptyTaskIndex = minutes.todos.findIndex((todo) => !todo.task.trim());
    if (emptyTaskIndex >= 0) {
      message.warning(`第 ${emptyTaskIndex + 1} 条待办缺少任务描述`);
      return;
    }

    const payload: Minutes = {
      title: minutes.title.trim() || '会议纪要',
      summary: minutes.summary.trim(),
      decisions: minutes.decisions.map((decision) => decision.trim()).filter(Boolean),
      todos: minutes.todos.map((todo) => ({
        task: todo.task.trim(),
        owner: todo.owner.trim(),
        dueDate: todo.dueDate || '',
      })),
    };

    setExporting(true);
    try {
      const blob = await exportMinutes(payload);
      downloadBlob(blob, buildExportFileName(payload.title));
      setLiveMessage('Word 文档已开始下载');
      message.success('Word 文档已开始下载');
    } catch (error) {
      message.error(describeExportError(error));
    } finally {
      setExporting(false);
    }
  }

  /** 手动保存：已有本地记录时覆盖同一条，避免反复点击产生大量重复条目。 */
  function handleSaveLocal(): void {
    const saved = saveRecord(minutes, recordId);
    if (!saved.ok || !saved.record) {
      message.error(saved.error ?? '保存失败，请稍后重试');
      return;
    }

    setRecordId(saved.record.id);
    markSaved();
    setLiveMessage('已保存到本地记录');

    if (saved.error) {
      message.warning(saved.error);
    } else {
      message.success('已保存到本地记录');
    }
  }

  const columns: TableColumnsType<TodoItem> = [
    {
      title: '任务',
      dataIndex: 'task',
      width: 280,
      render: (_value, todo, index) => (
        <Input
          variant="borderless"
          className="cell-input"
          value={todo.task}
          aria-label={`第 ${index + 1} 条待办的任务`}
          maxLength={MAX_TODO_TASK_LENGTH}
          placeholder="任务描述"
          onChange={(event) => updateTodo(index, { task: event.target.value })}
        />
      ),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      width: 190,
      render: (_value, todo, index) => (
        <Input
          variant="borderless"
          className="cell-input"
          value={todo.owner}
          aria-label={`第 ${index + 1} 条待办的负责人`}
          maxLength={MAX_OWNER_LENGTH}
          placeholder="未明确"
          onChange={(event) => updateTodo(index, { owner: event.target.value })}
        />
      ),
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      width: 180,
      render: (_value, todo, index) => (
        <DatePicker
          variant="borderless"
          className="cell-date"
          value={todo.dueDate ? dayjs(todo.dueDate) : null}
          format="YYYY-MM-DD"
          placeholder="未明确"
          onChange={(date) =>
            updateTodo(index, { dueDate: date ? date.format('YYYY-MM-DD') : '' })
          }
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 92,
      render: (_value, _todo, index) => (
        <Button
          type="link"
          danger
          className="row-delete"
          aria-label={`删除第 ${index + 1} 条待办`}
          onClick={() => void removeTodo(index)}
        >
          删除
        </Button>
      ),
    },
  ];

  // antd Table 需要稳定的 key；待办没有业务 id，用位置生成即可。
  const tableData = minutes.todos.map((todo, index) => ({ ...todo, key: String(index) }));

  return (
    <section className="editor-sheet" aria-busy={exporting}>
      <header className="editor-header">
        <label className="sr-only" htmlFor="minutes-title">
          纪要标题
        </label>
        <Input
          id="minutes-title"
          variant="borderless"
          className="title-input"
          value={minutes.title}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="纪要标题"
          onChange={(event) =>
            updateMinutes((current) => ({ ...current, title: event.target.value }))
          }
        />
        <span className={dirty ? 'status-tag is-dirty' : 'status-tag'}>{statusText}</span>
      </header>

      {meta ? (
        <p className="editor-meta">
          {meta.sourceType === 'file' ? meta.fileName ?? '上传文件' : '粘贴文本'} ·{' '}
          {meta.charCount.toLocaleString('zh-CN')} 字符
          {meta.cached ? <span className="meta-cached">· 相同原文，复用上次结果</span> : null}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

      <section className="editor-section" aria-labelledby="summary-heading">
        <div className="section-heading">
          <h3 id="summary-heading">会议摘要</h3>
        </div>
        <label className="sr-only" htmlFor="minutes-summary">
          会议摘要
        </label>
        <Input.TextArea
          id="minutes-summary"
          autoSize={{ minRows: 4, maxRows: 12 }}
          maxLength={MAX_SUMMARY_LENGTH}
          showCount
          placeholder="会议摘要"
          value={minutes.summary}
          onChange={(event) =>
            updateMinutes((current) => ({ ...current, summary: event.target.value }))
          }
        />
      </section>

      <section className="editor-section" aria-labelledby="decisions-heading">
        <div className="section-heading">
          <h3 id="decisions-heading">关键决策</h3>
          <Button type="link" onClick={addDecision}>
            + 添加决策
          </Button>
        </div>

        {minutes.decisions.length ? (
          <div className="decision-list">
            {minutes.decisions.map((decision, index) => (
              <div className="decision-row" key={index}>
                <span className="decision-index" aria-hidden="true">
                  {index + 1}.
                </span>
                <input
                  className="line-input"
                  type="text"
                  value={decision}
                  aria-label={`第 ${index + 1} 条关键决策`}
                  maxLength={MAX_DECISION_LENGTH}
                  placeholder="描述一条关键决策"
                  onChange={(event) =>
                    updateMinutes((current) => ({
                      ...current,
                      decisions: current.decisions.map((item, decisionIndex) =>
                        decisionIndex === index ? event.target.value : item,
                      ),
                    }))
                  }
                />
                <Button
                  type="link"
                  danger
                  aria-label={`删除第 ${index + 1} 条决策`}
                  onClick={() => removeDecision(index)}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">还没有关键决策。点击“添加决策”记录一条。</p>
        )}
      </section>

      <section className="editor-section" aria-labelledby="todos-heading">
        <div className="section-heading">
          <h3 id="todos-heading">待办事项</h3>
          <Button type="link" onClick={addTodo}>
            + 添加待办
          </Button>
        </div>

        {minutes.todos.length ? (
          <div className="todo-table-wrap">
            <Table<TodoItem>
              className="todo-table"
              columns={columns}
              dataSource={tableData}
              rowKey="key"
              pagination={false}
              size="small"
            />
          </div>
        ) : (
          <p className="empty-state">还没有待办事项。点击“添加待办”创建一条。</p>
        )}
      </section>

      <div className="editor-actions">
        <div className="action-buttons">
          <Button type="primary" ghost onClick={() => void handleCopy()}>
            复制纪要
          </Button>
          <Button type="primary" loading={exporting} onClick={() => void handleExport()}>
            导出 Word
          </Button>
          <Button disabled={!dirty} onClick={handleSaveLocal}>
            保存到本地
          </Button>
        </div>
        <p className="actions-tip">负责人和日期留空时，展示与复制时都会标记为“未明确”。</p>
      </div>
    </section>
  );
}
