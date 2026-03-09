'use client';

import { useRef, useState } from 'react';
import styles from './HtmlImportModal.module.css';

export interface HtmlImportData {
  title: string;
  body: string;
}

interface HtmlImportModalProps {
  onImport: (data: HtmlImportData) => void;
  onClose: () => void;
}

function parseHtmlFile(html: string): HtmlImportData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // タイトルを抽出: <title> → <h1> → 空文字
  const titleEl = doc.querySelector('title');
  const h1El = doc.querySelector('h1');
  const title = titleEl?.textContent?.trim() || h1El?.textContent?.trim() || '';

  // 本文を抽出: <body> の innerHTML（h1がタイトルとして使われた場合は除外）
  const body = doc.body;
  if (h1El && title === h1El.textContent?.trim()) {
    h1El.remove();
  }

  return { title, body: body?.innerHTML?.trim() || '' };
}

export default function HtmlImportModal({ onImport, onClose }: HtmlImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<HtmlImportData | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target?.result as string;
      setParsed(parseHtmlFile(html));
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsed) return;
    onImport(parsed);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>HTMLファイルインポート</h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.fileArea}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleFileChange}
            hidden
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.fileButton}
          >
            .htmlファイルを選択
          </button>
          {fileName && <span className={styles.fileName}>{fileName}</span>}
        </div>

        {parsed && (
          <>
            <div className={styles.parsedSection}>
              <p className={styles.previewLabel}>タイトル</p>
              <div className={styles.parsedTitle}>{parsed.title || '（タイトルなし）'}</div>
            </div>
            <div className={styles.preview}>
              <p className={styles.previewLabel}>本文プレビュー</p>
              <div
                className={styles.previewContent}
                dangerouslySetInnerHTML={{ __html: parsed.body }}
              />
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>キャンセル</button>
          <button onClick={handleImport} className={styles.importButton} disabled={!parsed}>
            インポート
          </button>
        </div>
      </div>
    </div>
  );
}
