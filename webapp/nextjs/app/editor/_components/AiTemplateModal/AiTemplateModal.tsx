'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { WizardStep, TemplateCandidate } from './types';
import { useCompanyQuery } from '@/app/settings/_hooks/useCompanyInfo';
import { useCategoriesQuery } from '../../_hooks/useCategories';
import styles from './AiTemplateModal.module.css';

interface AiTemplateModalProps {
  onApply: (title: string, content: string) => void;
  onClose: () => void;
}

export default function AiTemplateModal({ onApply, onClose }: AiTemplateModalProps) {
  const [step, setStep] = useState<WizardStep>('input');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [purpose, setPurpose] = useState('');
  const [candidates, setCandidates] = useState<TemplateCandidate[]>([]);
  const [error, setError] = useState('');

  const { data: company, isPending: isLoadingCompany } = useCompanyQuery();
  const { data: categories = [], isPending: isLoadingCategories } = useCategoriesQuery();

  const isLoading = isLoadingCompany || isLoadingCategories;
  const hasCompanyInfo = company?.name && company?.businesses?.length > 0;

  const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);

  const handleGenerate = async () => {
    if (!selectedCategorySlug || !company) return;
    setStep('generating');
    setError('');

    const businessDescription = (company.businesses || [])
      .map((b) => b.description)
      .filter(Boolean)
      .join('、');

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          businessDescription,
          employeeCount: company.employee_count,
          challenge: company.challenge,
          appeal: company.appeal,
          categoryName: selectedCategory?.name || selectedCategorySlug,
          purpose,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'テンプレートの生成に失敗しました');
      }

      const data = await res.json();
      setCandidates(data.candidates || []);
      setStep('candidates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'テンプレートの生成に失敗しました');
      setStep('input');
    }
  };

  const handleApplyCandidate = (candidate: TemplateCandidate) => {
    onApply(candidate.title, JSON.stringify(candidate.content));
    onClose();
  };

  const handleBack = () => {
    setStep('input');
  };

  const renderContentPreview = (content: TemplateCandidate['content']): string => {
    try {
      const nodes = content?.content;
      if (!nodes) return '';
      return nodes
        .map((node) => {
          const text =
            node.content?.map((c) => c.text || '').join('') || '';
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
    } catch {
      return '';
    }
  };

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
                    {company.name} —{' '}
                    {company.businesses
                      .map((b) => b.description)
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
                          selectedCategorySlug === cat.slug
                            ? styles.categoryCardSelected
                            : styles.categoryCard
                        }
                        onClick={() => setSelectedCategorySlug(cat.slug)}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>プレスリリースの目的</label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
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
                    disabled={!selectedCategorySlug}
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
