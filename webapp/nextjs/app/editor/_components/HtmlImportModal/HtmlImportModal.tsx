'use client';

import { useState } from 'react';
import styles from './HtmlImportModal.module.css';

interface HtmlImportModalProps {
  onImport: (html: string) => void;
  onClose: () => void;
}

export default function HtmlImportModal({ onImport, onClose }: HtmlImportModalProps) {
  const [html, setHtml] = useState('');

  const handleImport = () => {
    if (!html.trim()) return;
    onImport(html);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>HTMLインポート</h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>
        <textarea
          className={styles.textarea}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="HTMLを貼り付けてください"
          rows={15}
        />
        <div className={styles.preview}>
          <p className={styles.previewLabel}>プレビュー</p>
          <div
            className={styles.previewContent}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>キャンセル</button>
          <button onClick={handleImport} className={styles.importButton} disabled={!html.trim()}>
            インポート
          </button>
        </div>
      </div>
    </div>
  );
}
