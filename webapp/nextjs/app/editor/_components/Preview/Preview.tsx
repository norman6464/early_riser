'use client';

import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import styles from './Preview.module.css';

interface PreviewProps {
  title: string;
  contentJson: string;
  onClose: () => void;
}

export default function Preview({ title, contentJson, onClose }: PreviewProps) {
  const html = useMemo(() => {
    try {
      const json = JSON.parse(contentJson);
      return generateHTML(json, [
        Document,
        Heading,
        Image,
        Paragraph,
        Text,
        Link,
        Underline,
        BulletList,
        OrderedList,
        ListItem,
        Bold,
        Italic,
      ]);
    } catch {
      return '<p>プレビューを生成できませんでした。</p>';
    }
  }, [contentJson]);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>プレビュー</div>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.content}>
          <h1 className={styles.previewTitle}>{title || '（タイトル未入力）'}</h1>
          <div className={styles.meta}>
            <span>{today}</span>
          </div>
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
