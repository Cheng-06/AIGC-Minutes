import { Alert, Button, Input, Tabs, Upload } from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  MAX_TEXT_CHARS,
} from '../constants';
import type { GenerateInput } from '../types/minutes';
import './InputPanel.css';

interface InputPanelProps {
  loading: boolean;
  initialText?: string;
  onGenerate: (input: GenerateInput) => void;
}

function validateFile(file: File): string {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.doc')) {
    return '暂不支持旧版 .doc 文件，请另存为 .docx 后重试';
  }

  if (!ACCEPTED_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension))) {
    return '仅支持 TXT 和 DOCX 文件';
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `文件不能超过 ${MAX_FILE_SIZE_MB}MB`;
  }

  return '';
}

export default function InputPanel({ loading, initialText, onGenerate }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [text, setText] = useState(initialText ?? '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // 首页示例或“重新输入”会从外部传入新原文；空值不覆盖用户正在编辑的内容。
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  function handleFileChange(info: UploadChangeParam<UploadFile>): void {
    const nextFile = info.fileList[0];
    const rawFile = nextFile?.originFileObj;

    if (!rawFile) {
      setSelectedFile(null);
      setFileList([]);
      return;
    }

    const validationMessage = validateFile(rawFile);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSelectedFile(null);
      setFileList([]);
      return;
    }

    setErrorMessage('');
    setSelectedFile(rawFile);
    setFileList([nextFile]);
  }

  function handleFileRemove(): void {
    setSelectedFile(null);
    setFileList([]);
  }

  function submit(): void {
    setErrorMessage('');

    if (activeTab === 'text') {
      const content = text.trim();
      if (!content) {
        setErrorMessage('请先粘贴会议内容');
        return;
      }
      if (text.length > MAX_TEXT_CHARS) {
        setErrorMessage(`文本超过 ${MAX_TEXT_CHARS} 字符，请精简后重试`);
        return;
      }
      onGenerate({ type: 'text', text: content });
      return;
    }

    if (!selectedFile) {
      setErrorMessage('请先选择 TXT 或 DOCX 文件');
      return;
    }

    onGenerate({ type: 'file', file: selectedFile });
  }

  return (
    <section className="input-panel" aria-busy={loading} aria-labelledby="input-title">
      <div className="panel-heading">
        <span className="panel-step" aria-hidden="true">
          01
        </span>
        <div className="panel-heading-copy">
          <h2 id="input-title">输入会议原文</h2>
          <p>粘贴文本，或上传一个 TXT、DOCX 文件。原文越完整，整理结果越可靠。</p>
        </div>
      </div>

      <Tabs
        className="input-tabs"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key === 'file' ? 'file' : 'text')}
        items={[
          {
            key: 'text',
            label: '粘贴文本',
            children: (
              <>
                <label className="field-label" htmlFor="meeting-text">
                  会议原文
                </label>
                <Input.TextArea
                  id="meeting-text"
                  name="meeting-text"
                  autoComplete="off"
                  rows={9}
                  disabled={loading}
                  aria-describedby="meeting-text-help"
                  aria-invalid={text.length > MAX_TEXT_CHARS}
                  placeholder="把会议记录粘贴到这里，例如：讨论了什么、达成了哪些结论、谁负责哪些后续事项……"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <div
                  id="meeting-text-help"
                  className={text.length > MAX_TEXT_CHARS ? 'char-count is-over' : 'char-count'}
                  aria-live={text.length > MAX_TEXT_CHARS ? 'polite' : 'off'}
                >
                  {text.length} / {MAX_TEXT_CHARS} 字符
                </div>
              </>
            ),
          },
          {
            key: 'file',
            label: '上传文件',
            children: (
              <>
                <p id="file-hint" className="file-hint">
                  支持 TXT、DOCX，单个文件不超过 {MAX_FILE_SIZE_MB}MB。
                </p>
                <Upload.Dragger
                  accept=".txt,.docx"
                  maxCount={1}
                  multiple={false}
                  beforeUpload={() => false}
                  fileList={fileList}
                  disabled={loading}
                  onChange={handleFileChange}
                  onRemove={handleFileRemove}
                >
                  <div className="upload-text">
                    <p>
                      拖拽文件到此处，或 <em>点击选择</em>
                    </p>
                    <p className="upload-hint">一次只能上传一个文件；旧版 .doc 请先另存为 .docx。</p>
                  </div>
                </Upload.Dragger>
              </>
            ),
          },
        ]}
      />

      {errorMessage ? (
        <Alert
          className="input-error"
          type="error"
          showIcon
          closable={false}
          role="alert"
          message={errorMessage}
        />
      ) : null}

      <div className="input-actions">
        <Button type="primary" size="large" className="generate-button" loading={loading} onClick={submit}>
          生成纪要
        </Button>
        <p className="action-tip">生成通常需要 10–60 秒；请保持页面打开。</p>
      </div>
    </section>
  );
}
