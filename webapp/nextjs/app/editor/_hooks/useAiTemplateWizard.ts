import { useState, useRef, useCallback } from 'react';
import type { WizardStep, TemplateCandidate } from '../_components/AiTemplateModal/types';
import type { Company, PressReleaseCategory } from '@/lib/types';
import { API_URL } from '../_lib/constants';

interface UseAiTemplateWizardOptions {
  company: Company | null | undefined;
  selectedCategory: PressReleaseCategory | undefined;
  onApply: (title: string, content: string) => void;
  onClose: () => void;
}

export function useAiTemplateWizard({
  company,
  selectedCategory,
  onApply,
  onClose,
}: UseAiTemplateWizardOptions) {
  const [step, setStep] = useState<WizardStep>('input');
  const [candidates, setCandidates] = useState<TemplateCandidate[]>([]);
  const [error, setError] = useState('');
  const purposeRef = useRef('');

  const handleGenerate = useCallback(async () => {
    if (!company) return;
    setStep('generating');
    setError('');

    const businessDescription = (company.businesses || [])
      .map((b) => b.description)
      .filter(Boolean)
      .join('、');
    // AIに渡すためのデータを整形
    try {
      const res = await fetch(`${API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          businessDescription,
          employeeCount: company.employee_count,
          challenge: company.challenge,
          appeal: company.appeal,
          categoryName: selectedCategory?.name || '',
          purpose: purposeRef.current,
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
  }, [company, selectedCategory]);

  const handleApplyCandidate = useCallback(
    (candidate: TemplateCandidate) => {
      onApply(candidate.title, JSON.stringify(candidate.content));
      onClose();
    },
    [onApply, onClose],
  );

  const handleBack = useCallback(() => {
    setStep('input');
  }, []);

  return { step, candidates, error, purposeRef, handleGenerate, handleApplyCandidate, handleBack };
}
