import type { TipTapContent } from '@/lib/types';

export interface AiTemplateFormData {
  companyName: string;
  businessDescription: string;
  employeeCount: number;
  challenge: string;
  appeal: string;
  category: string | null;
  purpose: string;
}

export interface TemplateCandidate {
  title: string;
  content: TipTapContent;
}

export type WizardStep = 'input' | 'generating' | 'candidates';
