'use client';

import { useState } from 'react';
import styles from './AiAssistant.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AiAssistantProps {
  currentTitle: string;
  currentContent: string;
  onApplyTitle: (title: string) => void;
  onApplyContent: (content: string) => void;
  onClose: () => void;
}

type Tab = 'title' | 'proofread';

export default function AiAssistant({
  currentTitle,
  currentContent,
  onApplyTitle,
  onApplyContent,
  onClose,
}: AiAssistantProps) {
  const [tab, setTab] = useState<Tab>('title');
  const [loading, setLoading] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [proofreadResult, setProofreadResult] = useState('');

  const handleSuggestTitles = async () => {
    setLoading(true);
    setTitleSuggestions([]);
    try {
      const res = await fetch(`${API_URL}/api/ai/suggest-titles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent }),
      });
      if (!res.ok) throw new Error('タイトル提案の取得に失敗しました');
      const data = await res.json();
      setTitleSuggestions(data.titles || []);
    } catch (error) {
      console.error(error);
      alert('AIタイトル提案の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleProofread = async () => {
    setLoading(true);
    setProofreadResult('');
    try {
      const res = await fetch(`${API_URL}/api/ai/proofread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentContent }),
      });
      if (!res.ok) throw new Error('校正に失敗しました');
      const data = await res.json();
      setProofreadResult(data.text || '');
    } catch (error) {
      console.error(error);
      alert('AI校正の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>AIアシスタント</div>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={tab === 'title' ? styles.tabActive : styles.tab}
            onClick={() => setTab('title')}
          >
            タイトル提案
          </button>
          <button
            className={tab === 'proofread' ? styles.tabActive : styles.tab}
            onClick={() => setTab('proofread')}
          >
            文章校正
          </button>
        </div>

        {tab === 'title' && (
          <div>
            <div className={styles.section}>
              <div className={styles.label}>現在のタイトル</div>
              <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '6px', fontSize: '0.9rem' }}>
                {currentTitle || '（未入力）'}
              </div>
            </div>
            <button
              className={styles.generateButton}
              onClick={handleSuggestTitles}
              disabled={loading || !currentContent}
            >
              {loading ? 'AIが考え中...' : '本文からタイトルを提案'}
            </button>
            {titleSuggestions.length > 0 && (
              <div className={styles.results}>
                {titleSuggestions.map((title, i) => (
                  <div key={i} className={styles.titleOption}>
                    <div className={styles.titleText}>{title}</div>
                    <button
                      className={styles.applyButton}
                      onClick={() => {
                        onApplyTitle(title);
                        onClose();
                      }}
                    >
                      適用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'proofread' && (
          <div>
            <button
              className={styles.generateButton}
              onClick={handleProofread}
              disabled={loading || !currentContent}
            >
              {loading ? 'AIが校正中...' : '本文を校正する'}
            </button>
            {proofreadResult && (
              <div className={styles.results}>
                <div className={styles.label}>校正結果</div>
                <div className={styles.proofreadResult}>{proofreadResult}</div>
                <button
                  className={styles.applyFullButton}
                  onClick={() => {
                    onApplyContent(proofreadResult);
                    onClose();
                  }}
                >
                  校正結果を適用
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
