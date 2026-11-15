import { create } from 'zustand';
import type {
  GenerateResult,
  LocalMinutesRecord,
  Minutes,
  MinutesMeta,
  SourceSnapshot,
} from '../types/minutes';

interface MinutesSnapshot {
  minutes: Minutes | null;
  meta: MinutesMeta | null;
  source: SourceSnapshot | null;
  loading: boolean;
  error: string;
  dirty: boolean;
  recordId: string | null;
}

interface MinutesActions {
  setResult: (result: GenerateResult) => void;
  setLoadedRecord: (record: LocalMinutesRecord) => void;
  setSource: (source: SourceSnapshot) => void;
  setRecordId: (id: string | null) => void;
  markSaved: () => void;
  setLoading: (value: boolean) => void;
  setError: (message: string) => void;
  markDirty: () => void;
  /** React 没有深层 watch：所有编辑都经由这里做不可变更新，同时标记“未保存”。 */
  updateMinutes: (updater: (minutes: Minutes) => Minutes) => void;
}

/**
 * 模块级单例 store：工作台与本地记录页共享同一份“当前纪要”，不需要 Provider。
 */
export const useMinutesStore = create<MinutesSnapshot & MinutesActions>((set) => ({
  minutes: null,
  meta: null,
  source: null,
  loading: false,
  error: '',
  dirty: false,
  recordId: null,

  setResult: (result) =>
    set({
      minutes: result.minutes,
      meta: result.meta,
      source: null,
      error: '',
      dirty: false,
      recordId: null,
    }),

  /** 从本地记录载入时复制一份，避免编辑历史列表里的原始对象。 */
  setLoadedRecord: (record) =>
    set({
      minutes: JSON.parse(JSON.stringify(record.minutes)) as Minutes,
      meta: null,
      source: null,
      error: '',
      dirty: false,
      recordId: record.id,
    }),

  setSource: (source) => set({ source }),
  setRecordId: (id) => set({ recordId: id }),
  markSaved: () => set({ dirty: false }),
  setLoading: (value) => set({ loading: value }),
  setError: (message) => set({ error: message }),
  markDirty: () => set({ dirty: true }),

  updateMinutes: (updater) =>
    set((state) => (state.minutes ? { minutes: updater(state.minutes), dirty: true } : {})),
}));
