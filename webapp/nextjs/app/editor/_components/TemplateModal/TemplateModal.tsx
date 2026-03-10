'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Download, Trash2 } from 'lucide-react';
import type { Template } from '@/lib/types';
import styles from './TemplateModal.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface TemplateModalProps {
  mode: 'save' | 'load';
  currentTitle: string;
  currentContent: string;
  onLoad: (title: string, content: string) => void;
  onClose: () => void;
}

export default function TemplateModal({ mode, currentTitle, currentContent, onLoad, onClose }: TemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [], isPending } = useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<Template[]> => {
      const res = await fetch(`${API_URL}/api/templates`);
      if (!res.ok) throw new Error('テンプレートの取得に失敗しました');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; title: string; content: string }) => {
      const res = await fetch(`${API_URL}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('テンプレートの保存に失敗しました');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('テンプレートの削除に失敗しました');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleSave = () => {
    if (!templateName.trim()) return;
    saveMutation.mutate({
      name: templateName.trim(),
      title: currentTitle,
      content: currentContent,
    });
  };

  const handleLoad = (template: Template) => {
    onLoad(template.title, template.content);
    onClose();
  };

  const handleDelete = (id: number) => {
    if (!confirm('このテンプレートを削除しますか？')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'save' ? 'テンプレートとして保存' : 'テンプレートから作成'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}><X size={16} /></button>
        </div>

        {mode === 'save' && (
          <div className={styles.saveSection}>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="テンプレート名を入力"
              className={styles.nameInput}
            />
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={!templateName.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        )}

        <div className={styles.listSection}>
          {mode === 'save' && templates.length > 0 && (
            <p className={styles.listLabel}>保存済みテンプレート</p>
          )}
          {isPending ? (
            <p className={styles.loading}>読み込み中...</p>
          ) : templates.length === 0 ? (
            <p className={styles.empty}>テンプレートがありません</p>
          ) : (
            <ul className={styles.list}>
              {templates.map((t) => (
                <li key={t.id} className={styles.listItem}>
                  <div className={styles.listItemInfo}>
                    <span className={styles.listItemName}>{t.name}</span>
                    <span className={styles.listItemTitle}>{t.title || '（タイトルなし）'}</span>
                  </div>
                  <div className={styles.listItemActions}>
                    {mode === 'load' && (
                      <button onClick={() => handleLoad(t)} className={styles.loadButton}>
                        適用
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className={styles.deleteButton}
                      disabled={deleteMutation.isPending}
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
