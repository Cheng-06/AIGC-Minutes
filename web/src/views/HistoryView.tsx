import { App as AntdApp, Button } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearRecords, listRecords, removeRecord } from '../lib/localMinutes';
import { useMinutesStore } from '../store/minutesStore';
import { LOCAL_HISTORY_LIMIT } from '../constants';
import type { LocalMinutesRecord, Minutes } from '../types/minutes';
import { confirmAction } from '../utils/confirm';
import './HistoryView.css';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const dateOnlyFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeOnlyFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatSavedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatDay(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateOnlyFormatter.format(date).replace(/\//g, '.');
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : timeOnlyFormatter.format(date);
}

function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function excerpt(minutes: Minutes): string {
  const text = minutes.summary.replace(/\s+/g, ' ').trim();
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

export default function HistoryView() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();

  const minutes = useMinutesStore((state) => state.minutes);
  const dirty = useMinutesStore((state) => state.dirty);
  const setLoadedRecord = useMinutesStore((state) => state.setLoadedRecord);

  const [records, setRecords] = useState<LocalMinutesRecord[]>([]);

  function reload(): void {
    setRecords(listRecords());
  }

  useEffect(reload, []);

  async function handleLoad(record: LocalMinutesRecord): Promise<void> {
    if (minutes && dirty) {
      const confirmed = await confirmAction(modal, {
        title: '载入本地记录',
        content: '当前未保存修改会被替换。',
        okText: '继续载入',
        cancelText: '取消',
      });
      if (!confirmed) {
        return;
      }
    }

    setLoadedRecord(record);
    message.success('已载入工作台');
    navigate('/workspace');
  }

  async function handleRemove(record: LocalMinutesRecord): Promise<void> {
    const confirmed = await confirmAction(modal, {
      title: '删除本地记录',
      content: '删除后无法恢复，确定删除这条记录吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    removeRecord(record.id);
    reload();
    message.success('已删除该条记录');
  }

  async function handleClear(): Promise<void> {
    const confirmed = await confirmAction(modal, {
      title: '清空本地记录',
      content: '清空后无法恢复，确定删除全部本地记录吗？',
      okText: '清空',
      okButtonProps: { danger: true },
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    clearRecords();
    reload();
    message.success('已清空本地记录');
  }

  return (
    <div className="history-page">
      <div className="history-inner">
        <header className="history-head">
          <div className="history-heading">
            <p className="eyebrow">LIBRARY · 本地</p>
            <h1>本地记录</h1>
            <p className="history-intro">
              只保存在当前浏览器，最多 {LOCAL_HISTORY_LIMIT} 条。生成纪要后会自动保存在这里。
            </p>
          </div>

          <div className="history-actions" aria-label="记录操作">
            <span className="history-count">
              {records.length} / {LOCAL_HISTORY_LIMIT}
            </span>
            <Button
              type="text"
              className="clear-button"
              disabled={records.length === 0}
              onClick={() => void handleClear()}
            >
              清空全部
            </Button>
            <Link className="button button-secondary" to="/workspace">
              新建纪要
            </Link>
          </div>
        </header>

        {records.length ? (
          <section className="archive-panel" aria-label="本地记录列表">
            <ul className="archive-list">
              {records.map((record, index) => (
                <li key={record.id} className="archive-item">
                  <article className="archive-row">
                    <time
                      className="archive-date"
                      dateTime={record.savedAt}
                      title={formatSavedAt(record.savedAt)}
                    >
                      <span className="archive-day">{formatDay(record.savedAt)}</span>
                      <span className="archive-clock">{formatTime(record.savedAt)}</span>
                    </time>

                    <div className="archive-main">
                      <div className="archive-title-line">
                        <span className="archive-index" aria-hidden="true">
                          {padIndex(index)}
                        </span>
                        <h2>{record.minutes.title}</h2>
                      </div>
                      <p className="archive-excerpt">{excerpt(record.minutes)}</p>
                      <p className="archive-meta">
                        <span>{record.minutes.todos.length} 条待办</span>
                        <span aria-hidden="true">·</span>
                        <span>{record.minutes.decisions.length} 条决策</span>
                      </p>
                    </div>

                    <div className="archive-actions">
                      <Button
                        className="load-button"
                        aria-label={`载入${record.minutes.title}`}
                        onClick={() => void handleLoad(record)}
                      >
                        载入
                      </Button>
                      <Button
                        type="text"
                        danger
                        className="delete-button"
                        aria-label={`删除${record.minutes.title}`}
                        onClick={() => void handleRemove(record)}
                      >
                        删除
                      </Button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="archive-empty">
            <span className="empty-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <h2>还没有本地记录</h2>
            <p>生成纪要后会自动保存在当前浏览器，最多保留 {LOCAL_HISTORY_LIMIT} 条。</p>
            <Link className="button button-primary" to="/workspace">
              去工作台
            </Link>
          </div>
        )}

        <p className="privacy-tip">本地记录保存在当前浏览器中，不会上传服务器；共用电脑时请及时清空。</p>
      </div>
    </div>
  );
}
