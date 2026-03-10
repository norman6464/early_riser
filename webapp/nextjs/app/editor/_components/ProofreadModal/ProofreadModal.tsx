'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '../../_lib/constants';
import styles from './ProofreadModal.module.css';

interface ProofreadResult {
  original_title: string;
  original_body: string;
  corrected_title: string;
  corrected_body: string;
}

interface ProofreadModalProps {
  title: string;
  body: string;
  onApply: (correctedTitle: string, correctedBody: string) => void;
  onClose: () => void;
}

export default function ProofreadModal({ title, body, onApply, onClose }: ProofreadModalProps) {
  const [result, setResult] = useState<ProofreadResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProofread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/proofread`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || '校正に失敗しました');
        }

        const data: ProofreadResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '校正に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProofread();
  }, [title, body]);

  const hasTitleChange = result ? result.original_title !== result.corrected_title : false;
  const hasBodyChange = result ? result.original_body !== result.corrected_body : false;
  const hasChanges = hasTitleChange || hasBodyChange;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>誤字修正</h2>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        {isLoading && (
          <div className={styles.loading}>校正中...</div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {result && !hasChanges && (
          <div className={styles.noChanges}>修正箇所はありませんでした</div>
        )}

        {result && hasChanges && (
          <>
            {hasTitleChange && (
              <div className={styles.section}>
                <p className={styles.sectionTitle}>タイトル</p>
                <div className={styles.diffContainer}>
                  <div className={styles.diffColumn}>
                    <p className={`${styles.diffLabel} ${styles.diffLabelOriginal}`}>修正前</p>
                    <div className={styles.diffText}>{result.original_title}</div>
                  </div>
                  <div className={styles.diffColumn}>
                    <p className={`${styles.diffLabel} ${styles.diffLabelCorrected}`}>修正後</p>
                    <div className={styles.diffText}>{result.corrected_title}</div>
                  </div>
                </div>
              </div>
            )}

            {hasBodyChange && (
              <div className={styles.section}>
                <p className={styles.sectionTitle}>本文</p>
                <div className={styles.diffContainer}>
                  <div className={styles.diffColumn}>
                    <p className={`${styles.diffLabel} ${styles.diffLabelOriginal}`}>修正前</p>
                    <div className={styles.diffText}>{result.original_body}</div>
                  </div>
                  <div className={styles.diffColumn}>
                    <p className={`${styles.diffLabel} ${styles.diffLabelCorrected}`}>修正後</p>
                    <div className={styles.diffText}>{result.corrected_body}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            キャンセル
          </button>
          <button
            onClick={() => {
              if (result) {
                onApply(result.corrected_title, result.corrected_body);
              }
            }}
            className={styles.applyButton}
            disabled={isLoading || !hasChanges}
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}
