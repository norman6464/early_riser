'use client';

import { useState, useEffect } from 'react';
import { X, Lightbulb, Check } from 'lucide-react';
import { API_URL } from '../../_lib/constants';
import styles from './TitleSuggestionModal.module.css';

interface TitleSuggestionModalProps {
  currentTitle: string;
  bodyText: string;
  onApply: (title: string) => void;
  onClose: () => void;
}

export default function TitleSuggestionModal({
  currentTitle,
  bodyText,
  onApply,
  onClose,
}: TitleSuggestionModalProps) {
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/suggest-titles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: bodyText, current_title: currentTitle }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'タイトル提案の取得に失敗しました');
        }

        const data = await res.json();
        setTitles(data.titles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'タイトル提案の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [bodyText, currentTitle]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Lightbulb size={18} className={styles.headerIcon} />
            <h2 className={styles.title}>AIタイトル提案</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        </div>

        {currentTitle && (
          <div className={styles.currentTitle}>
            <span className={styles.currentTitleLabel}>現在のタイトル</span>
            <p className={styles.currentTitleText}>{currentTitle}</p>
          </div>
        )}

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            AIがタイトルを考えています...
          </div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {!isLoading && !error && titles.length > 0 && (
          <div className={styles.titleList}>
            {titles.map((title, index) => (
              <button
                key={index}
                className={`${styles.titleItem} ${selectedIndex === index ? styles.titleItemSelected : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className={styles.titleNumber}>{index + 1}</span>
                <span className={styles.titleText}>{title}</span>
                {selectedIndex === index && (
                  <Check size={16} className={styles.checkIcon} />
                )}
              </button>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            キャンセル
          </button>
          <button
            onClick={() => {
              if (selectedIndex !== null && titles[selectedIndex]) {
                onApply(titles[selectedIndex]);
              }
            }}
            className={styles.applyButton}
            disabled={isLoading || selectedIndex === null}
          >
            このタイトルを適用
          </button>
        </div>
      </div>
    </div>
  );
}
