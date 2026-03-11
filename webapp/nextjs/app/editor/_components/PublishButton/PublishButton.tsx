'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import styles from './PublishButton.module.css';
import { PRESS_RELEASE_ID } from '../../_lib/constants';

interface PublishButtonProps {
  onSaveFirst: () => void;
}

export default function PublishButton({ onSaveFirst }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      // まず保存を実行
      onSaveFirst();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/press-releases/${PRESS_RELEASE_ID}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '公開に失敗しました');
        return;
      }

      setPublishedUrl(data.url);
      setShowModal(true);
    } catch {
      setError('公開処理中にエラーが発生しました');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
    }
  };

  return (
    <>
      <button
        onClick={handlePublish}
        className={styles.publishButton}
        disabled={isPublishing}
      >
        <Globe size={15} />
        {isPublishing ? '公開中...' : '公開'}
      </button>

      {error && (
        <div className={styles.errorToast}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>&times;</button>
        </div>
      )}

      {showModal && publishedUrl && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>公開完了</h3>
            <p className={styles.modalText}>
              プレスリリースが公開されました。以下のURLを記者やメディアに共有できます。
            </p>
            <div className={styles.urlBox}>
              <input
                type="text"
                value={publishedUrl}
                readOnly
                className={styles.urlInput}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button onClick={handleCopyUrl} className={styles.copyButton}>
                コピー
              </button>
            </div>
            <div className={styles.modalActions}>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.previewLink}
              >
                プレビューを開く
              </a>
              <button onClick={() => setShowModal(false)} className={styles.closeButton}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
