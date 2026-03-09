'use client';

import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import styles from './Toolbar.module.css';

// TODO: PHP APIに置き換える際はこのURLを変更する
const UPLOAD_API_URL = '/api/upload';

interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(UPLOAD_API_URL, { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '画像のアップロードに失敗しました');
        return;
      }
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('画像のアップロードに失敗しました');
    } finally {
      e.target.value = '';
    }
  };

  const handleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const handleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const handleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  const handleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const handleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleLink = () => {
    const url = prompt('リンクURLを入力してください');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const buttonClass = (name: string) =>
    `${styles.toolbarButton} ${editor.isActive(name) ? styles.toolbarButtonActive : ''}`;

  return (
    <div className={styles.toolbar}>
      <button onClick={handleBold} className={buttonClass('bold')}>
        <strong>B</strong>
      </button>
      <button onClick={handleItalic} className={buttonClass('italic')}>
        <em>I</em>
      </button>
      <button onClick={handleUnderline} className={buttonClass('underline')}>
        <u>U</u>
      </button>
      <button onClick={handleBulletList} className={buttonClass('bulletList')}>
        箇条書き
      </button>
      <button onClick={handleOrderedList} className={buttonClass('orderedList')}>
        番号付きリスト
      </button>
      <button onClick={handleImageClick} className={styles.toolbarButton}>
        画像追加
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleImageUpload}
        hidden
      />
      <button onClick={handleLink} className={buttonClass('link')}>
        🔗
      </button>
    </div>
  );
}
