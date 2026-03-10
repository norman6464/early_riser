'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import type { TemplateCandidate } from './types';
import { useCompanyQuery } from '@/app/settings/_hooks/useCompanyInfo';
import { useCategoriesQuery } from '../../_hooks/useCategories';
import { useAiTemplateWizard } from '../../_hooks/useAiTemplateWizard';
import styles from './AiTemplateModal.module.css';

//レンダリングの度に再生成を防ぐためにスコープ外に移動
function renderContentPreview(content: TemplateCandidate['content']): string {
  try {
    const nodes = content?.content;
    if (!nodes) return '';
    const html = nodes
      .map((node: { type: string; attrs?: { level?: number }; content?: { text?: string }[] }) => {
        const text = node.content?.map((c) => c.text || '').join('') || '';
        if (node.type === 'heading') {
          const level = node.attrs?.level || 2;
          return `<h${level}>${text}</h${level}>`;
        }
        if (node.type === 'paragraph') {
          return text ? `<p>${text}</p>` : '<br />';
        }
        return '';
      })
      .join('');
    // AI生成テキストをHTML文字列結合しているため、XSS防止にサニタイズが必要
    return DOMPurify.sanitize(html);
  } catch {
    return '';
  }
}

interface AiTemplateModalProps {
  onApply: (title: string, content: string) => void;
  onClose: () => void;
}

export default function AiTemplateModal({ onApply, onClose }: AiTemplateModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data: company, isPending: isLoadingCompany } = useCompanyQuery();
  const { data: categories = [], isPending: isLoadingCategories } = useCategoriesQuery();
  const isLoading = isLoadingCompany || isLoadingCategories;

  const hasCompanyInfo = useMemo(
    () => !!(company?.name && (company?.businesses?.length ?? 0) > 0),
    [company],
  );

  const selectedCategory = useMemo(
    () => categories.find((c: { id: number }) => c.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );
  
  // useAiTemplateWizardから必要な状態と関数を取得
  const { step, candidates, error, purposeRef, handleGenerate, handleApplyCandidate, handleBack } =
    useAiTemplateWizard({ company, selectedCategory, onApply, onClose });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={step === 'candidates' ? styles.modalWide : styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === 'input' && 'AIテンプレート生成'}
            {step === 'generating' && 'テンプレート生成中'}
            {step === 'candidates' && '生成結果 — 候補を選択'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {step === 'input' && (
          <>
            {error && <p className={styles.errorText}>{error}</p>}

            {isLoading ? (
              <p className={styles.loadingText}>読み込み中...</p>
            ) : !hasCompanyInfo ? (
              <div className={styles.noCompanyInfo}>
                <p>企業情報が設定されていません。</p>
                <p>テンプレート生成には企業情報が必要です。</p>
                <Link
                  href="/settings"
                  className={styles.settingsLink}
                  onClick={onClose}
                >
                  設定ページで企業情報を登録する
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.companyInfoSummary}>
                  <p className={styles.companyInfoLabel}>企業情報</p>
                  <p className={styles.companyInfoValue}>
                    {company?.name} —{' '}
                    {company?.businesses
                      .map((b: { description: string }) => b.description)
                      .filter(Boolean)
                      .join('、')}
                  </p>
                  <Link
                    href="/settings"
                    className={styles.editLink}
                    onClick={onClose}
                  >
                    編集
                  </Link>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.categoryLabel}>カテゴリを選択</label>
                  <div className={styles.categoryGrid}>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={
                          selectedCategoryId === cat.id
                            ? styles.categoryCardSelected
                            : styles.categoryCard
                        }
                        onClick={() => setSelectedCategoryId(cat.id)}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>プレスリリースの目的</label>
                  <textarea
                    defaultValue=""
                    onChange={(e) => { purposeRef.current = e.target.value; }}
                    placeholder="例：新商品の認知拡大、採用応募数の増加"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formActions}>
                  <button onClick={onClose} className={styles.secondaryButton}>
                    キャンセル
                  </button>
                  <button
                    onClick={handleGenerate}
                    className={styles.primaryButton}
                    disabled={!selectedCategoryId}
                  >
                    生成する
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'generating' && (
          <div className={styles.generatingContainer}>
            <div className={styles.spinner} />
            <p className={styles.generatingText}>
              AIがテンプレートを生成しています...
            </p>
          </div>
        )}

        {step === 'candidates' && (
          <>
            <div className={styles.candidatesGrid}>
              {candidates.map((candidate, index) => (
                <div key={index} className={styles.candidateCard}>
                  <div className={styles.candidateHeader}>
                    <span className={styles.candidateLabel}>
                      候補 {index + 1}
                    </span>
                  </div>
                  <div className={styles.candidateTitle}>{candidate.title}</div>
                  <div
                    className={styles.candidateBody}
                    dangerouslySetInnerHTML={{
                      __html: renderContentPreview(candidate.content),
                    }}
                  />
                  <button
                    onClick={() => handleApplyCandidate(candidate)}
                    className={styles.primaryButton}
                  >
                    この候補を適用
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.previewActions}>
              <button onClick={handleBack} className={styles.secondaryButton}>
                戻る
              </button>
              <button onClick={handleGenerate} className={styles.secondaryButton}>
                再生成
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
