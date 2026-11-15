import type { ThemeConfig } from 'antd';

/**
 * 从 tokens.css 读取设计 token，避免在组件里重复写颜色值。
 * 读取失败时返回 undefined，交给 antd 默认值兜底。
 */
function readToken(name: string): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || undefined;
}

const colorPrimary = readToken('--color-primary');
const colorSuccess = readToken('--color-success');
const colorWarning = readToken('--color-warning');
const colorError = readToken('--color-danger');
const colorText = readToken('--color-fg');
const colorTextSecondary = readToken('--color-fg-muted');
const colorBorder = readToken('--color-border');
const fontFamily = readToken('--font-sans');

/** 把 tokens.css 的语义层映射到 antd 主题，组件内不再写死颜色。 */
export const antdTheme: ThemeConfig = {
  token: {
    ...(colorPrimary ? { colorPrimary } : {}),
    ...(colorSuccess ? { colorSuccess } : {}),
    ...(colorWarning ? { colorWarning } : {}),
    ...(colorError ? { colorError } : {}),
    ...(colorText ? { colorText } : {}),
    ...(colorTextSecondary ? { colorTextSecondary } : {}),
    ...(colorBorder ? { colorBorder } : {}),
    ...(fontFamily ? { fontFamily } : {}),
    borderRadius: 6,
    fontSize: 16,
  },
};
