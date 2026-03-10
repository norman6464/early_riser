'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import {
  useCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from './_hooks/useCompanyInfo';
import type { CompanyInput } from '@/lib/types';
import styles from './page.module.css';

export default function SettingsPage() {
  const { data: company, isPending: isLoading } = useCompanyQuery();
  const createMutation = useCreateCompanyMutation();
  const updateMutation = useUpdateCompanyMutation();

  const [showSaved, setShowSaved] = useState(false);
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [newBusiness, setNewBusiness] = useState('');

  const isNew = !company;
  const saveMutation = isNew ? createMutation : updateMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyInput>({
    defaultValues: {
      companyName: '',
      location: '',
      employeeCount: 0,
      challenge: '',
      appeal: '',
      businesses: [],
    },
  });

  useEffect(() => {
    if (company) {
      const biz = company.businesses.map((b) => b.description);
      setBusinesses(biz);
      reset({
        companyName: company.name || '',
        location: company.location || '',
        employeeCount: company.employee_count ?? 0,
        challenge: company.challenge || '',
        appeal: company.appeal || '',
        businesses: biz,
      });
    }
  }, [company, reset]);

  const onSubmit = (data: CompanyInput) => {
    saveMutation.mutate({ ...data, businesses }, {
      onSuccess: () => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      },
    });
  };

  const handleAddBusiness = () => {
    const value = newBusiness.trim();
    if (!value) return;
    setBusinesses((prev) => [...prev, value]);
    setNewBusiness('');
  };

  const handleDeleteBusiness = (index: number) => {
    setBusinesses((prev) => prev.filter((_, i) => i !== index));
  };

  // businesses の変更もフォームの dirty 判定に反映
  const businessesChanged = company
    ? JSON.stringify(businesses) !== JSON.stringify(company.businesses.map((b) => b.description))
    : businesses.length > 0;
  const isFormDirty = isDirty || businessesChanged;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>設定</h1>
        <Link href="/editor" className={styles.backLink}>
          エディターに戻る
        </Link>
      </header>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>企業情報</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label className={styles.label}>会社名</label>
            <input
              type="text"
              className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
              placeholder="例：株式会社○○"
              {...register('companyName', { required: '会社名を入力してください' })}
            />
            {errors.companyName && (
              <p className={styles.errorMessage}>{errors.companyName.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>所在地</label>
            <input
              type="text"
              className={styles.input}
              placeholder="例：東京都渋谷区○○1-2-3"
              {...register('location')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>従業員数</label>
            <input
              type="number"
              className={styles.input}
              placeholder="例：50"
              {...register('employeeCount', { valueAsNumber: true })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>自社の課題</label>
            <textarea
              className={styles.textarea}
              placeholder="例：認知度の向上、採用力の強化"
              {...register('challenge')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>自社のアピールポイント</label>
            <textarea
              className={styles.textarea}
              placeholder="例：業界シェアNo.1の独自技術、充実した福利厚生"
              {...register('appeal')}
            />
          </div>

          <div className={styles.formActions}>
            {showSaved && (
              <span className={styles.savedMessage}>保存しました</span>
            )}
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saveMutation.isPending || !isFormDirty}
            >
              {saveMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>

      {/* 事業内容セクション - フォーム内で管理し保存時にまとめて送信 */}
      <div className={styles.section} style={{ marginTop: '1.5rem' }}>
        <h2 className={styles.sectionTitle}>事業内容</h2>

        {businesses.length > 0 ? (
          <ul className={styles.businessList}>
            {businesses.map((desc, index) => (
              <li key={index} className={styles.businessItem}>
                <span className={styles.businessValue}>{desc}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleDeleteBusiness(index)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>事業内容が登録されていません</p>
        )}

        <div className={styles.fieldRow}>
          <input
            type="text"
            className={styles.input}
            placeholder="例：Webサービスの企画・開発・運営"
            value={newBusiness}
            onChange={(e) => setNewBusiness(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBusiness();
              }
            }}
          />
          <button
            type="button"
            className={styles.addButton}
            onClick={handleAddBusiness}
            disabled={!newBusiness.trim()}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
