import type { ModalFuncProps } from 'antd';

/**
 * 把 antd 的 modal.confirm 包装成 Promise，便于沿用原来的 try/await 流程。
 * 必须传入 App.useApp() 返回的 modal，才能继承 ConfigProvider 的主题与语言。
 */
export function confirmAction(
  modal: { confirm: (props: ModalFuncProps) => void },
  props: ModalFuncProps,
): Promise<boolean> {
  return new Promise((resolve) => {
    modal.confirm({
      ...props,
      onOk: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
    });
  });
}
