'use client';

import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  label: string;
  children: ReactNode;
}

/** ホバー時に即座にラベルを表示するカスタムツールチップ */
export default function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className={styles.wrapper}>
      {children}
      <span className={styles.tooltip} role="tooltip">{label}</span>
    </span>
  );
}
