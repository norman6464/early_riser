'use client';

import { useState, useEffect } from 'react';
import { X, BarChart3, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { API_URL } from '../../_lib/constants';
import styles from './ToneAnalysisModal.module.css';

interface ToneIssue {
  type: 'tone' | 'structure' | 'clarity' | 'expression' | 'missing';
  location: string;
  description: string;
  suggestion: string;
}

interface ToneAnalysisResult {
  overall_score: number;
  tone: string;
  readability: string;
  news_value: string;
  issues: ToneIssue[];
  strengths: string[];
  summary: string;
}

interface ToneAnalysisModalProps {
  title: string;
  bodyText: string;
  onClose: () => void;
}

const issueTypeLabels: Record<string, string> = {
  tone: 'トーン',
  structure: '構成',
  clarity: '明確さ',
  expression: '表現',
  missing: '不足',
};

function getScoreColor(score: number): string {
  if (score >= 80) return styles.scoreHigh;
  if (score >= 60) return styles.scoreMedium;
  return styles.scoreLow;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '素晴らしい';
  if (score >= 80) return '良好';
  if (score >= 70) return '合格';
  if (score >= 60) return '改善の余地あり';
  if (score >= 40) return '要改善';
  return '大幅な改善が必要';
}

export default function ToneAnalysisModal({
  title,
  bodyText,
  onClose,
}: ToneAnalysisModalProps) {
  const [result, setResult] = useState<ToneAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/analyze-tone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body: bodyText }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'トーン分析に失敗しました');
        }

        const data: ToneAnalysisResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'トーン分析に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [title, bodyText]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <BarChart3 size={18} className={styles.headerIcon} />
            <h2 className={styles.title}>AI文章トーン分析</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        </div>

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            文章を分析しています...
          </div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {result && (
          <div className={styles.content}>
            {/* スコアセクション */}
            <div className={styles.scoreSection}>
              <div className={`${styles.scoreCircle} ${getScoreColor(result.overall_score)}`}>
                <span className={styles.scoreValue}>{result.overall_score}</span>
                <span className={styles.scoreMax}>/100</span>
              </div>
              <div className={styles.scoreInfo}>
                <span className={styles.scoreLabel}>{getScoreLabel(result.overall_score)}</span>
                <p className={styles.scoreSummary}>{result.summary}</p>
              </div>
            </div>

            {/* 評価指標 */}
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>トーン</span>
                <span className={styles.metricValue}>{result.tone}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>読みやすさ</span>
                <span className={styles.metricValue}>{result.readability}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>ニュース性</span>
                <span className={styles.metricValue}>{result.news_value}</span>
              </div>
            </div>

            {/* 良い点 */}
            {result.strengths.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <CheckCircle size={14} className={styles.strengthIcon} />
                  良い点
                </h3>
                <ul className={styles.strengthList}>
                  {result.strengths.map((s, i) => (
                    <li key={i} className={styles.strengthItem}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 改善点 */}
            {result.issues.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <AlertTriangle size={14} className={styles.issueIcon} />
                  改善点 ({result.issues.length}件)
                </h3>
                <div className={styles.issueList}>
                  {result.issues.map((issue, i) => (
                    <div key={i} className={styles.issueItem}>
                      <div className={styles.issueHeader}>
                        <span className={styles.issueType}>
                          {issueTypeLabels[issue.type] || issue.type}
                        </span>
                        <span className={styles.issueLocation}>{issue.location}</span>
                      </div>
                      <p className={styles.issueDescription}>{issue.description}</p>
                      <div className={styles.issueSuggestion}>
                        <Info size={12} />
                        <span>{issue.suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.closeActionButton}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
