'use client';

import { useState, useEffect } from 'react';
import { X, FileText, ChevronRight, Sparkles, ArrowLeft, Plus } from 'lucide-react';
import { API_URL } from '../../_lib/constants';
import styles from './SectionGuideModal.module.css';

interface Section {
  id: string;
  name: string;
  questions: string[];
}

interface SectionGuideModalProps {
  currentTitle: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

export default function SectionGuideModal({
  currentTitle,
  onInsert,
  onClose,
}: SectionGuideModalProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // セクション定義を取得
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/sections`);
        if (!res.ok) throw new Error('セクション情報の取得に失敗しました');
        const data = await res.json();
        setSections(data.sections);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'セクション情報の取得に失敗しました');
      } finally {
        setIsLoadingSections(false);
      }
    };
    fetchSections();
  }, []);

  const handleSelectSection = (section: Section) => {
    setSelectedSection(section);
    setAnswers(new Array(section.questions.length).fill(''));
    setGeneratedContent(null);
    setError(null);
  };

  const handleBack = () => {
    setSelectedSection(null);
    setAnswers([]);
    setGeneratedContent(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedSection) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const res = await fetch(`${API_URL}/api/ai/generate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: selectedSection.id,
          answers,
          title: currentTitle,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '文章の生成に失敗しました');
      }

      const data = await res.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '文章の生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent);
    }
  };

  const hasAnswers = answers.some((a) => a.trim() !== '');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            {selectedSection && (
              <button onClick={handleBack} className={styles.backButton}>
                <ArrowLeft size={16} />
              </button>
            )}
            <FileText size={18} className={styles.headerIcon} />
            <h2 className={styles.title}>
              {selectedSection ? selectedSection.name : 'AI構成ガイド'}
            </h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        </div>

        {isLoadingSections && (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            読み込み中...
          </div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {/* セクション選択画面 */}
        {!selectedSection && !isLoadingSections && (
          <>
            <p className={styles.description}>
              プレスリリースの各セクションを選択し、質問に答えるだけでAIが文章を生成します。
            </p>
            <div className={styles.sectionList}>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  className={styles.sectionItem}
                  onClick={() => handleSelectSection(section)}
                >
                  <span className={styles.sectionNumber}>{index + 1}</span>
                  <div className={styles.sectionInfo}>
                    <span className={styles.sectionName}>{section.name}</span>
                    <span className={styles.sectionHint}>
                      {section.questions.length}つの質問に回答
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.sectionArrow} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* 質問入力画面 */}
        {selectedSection && !generatedContent && (
          <div className={styles.questionSection}>
            <p className={styles.questionIntro}>
              以下の質問に答えてください。回答を元にAIが「{selectedSection.name}」を作成します。
            </p>
            <div className={styles.questionList}>
              {selectedSection.questions.map((question, index) => (
                <div key={index} className={styles.questionItem}>
                  <label className={styles.questionLabel}>
                    <span className={styles.questionNumber}>Q{index + 1}</span>
                    {question}
                  </label>
                  <textarea
                    className={styles.questionInput}
                    value={answers[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[index] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder="回答を入力..."
                    rows={3}
                  />
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button onClick={handleBack} className={styles.cancelButton}>
                戻る
              </button>
              <button
                onClick={handleGenerate}
                className={styles.generateButton}
                disabled={isGenerating || !hasAnswers}
              >
                {isGenerating ? (
                  <>
                    <div className={styles.buttonSpinner} />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    AIで文章を生成
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 生成結果画面 */}
        {generatedContent && (
          <div className={styles.resultSection}>
            <p className={styles.resultLabel}>生成された文章</p>
            <div className={styles.resultContent}>
              {generatedContent}
            </div>
            <div className={styles.actions}>
              <button onClick={() => setGeneratedContent(null)} className={styles.cancelButton}>
                やり直す
              </button>
              <button onClick={handleInsert} className={styles.insertButton}>
                <Plus size={14} />
                エディタに挿入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
