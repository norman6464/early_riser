'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { getPresignedUrl, uploadToS3 } from '@/lib/imageUpload';
import HtmlImportModal, { type HtmlImportData } from '../HtmlImportModal/HtmlImportModal';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  editor: Editor | null;
  onHtmlImport: (data: HtmlImportData) => void;
  onImageUploaded?: () => void;
}

export default function Toolbar({ editor, onHtmlImport, onImageUploaded }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHtmlImport, setShowHtmlImport] = useState(false);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { uploadUrl, imageUrl } = await getPresignedUrl(file.type, file.name);
      await uploadToS3(uploadUrl, file);
      editor.chain().focus().setImage({ src: imageUrl }).run();
      onImageUploaded?.();
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
    const addImage = () => {
    const url = prompt('画像URLを入力してください');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  const handleHtmlImport = (data: HtmlImportData) => {
    onHtmlImport(data);
  };

  const buttonClass = (name: string) =>
    `${styles.toolbarButton} ${editor.isActive(name) ? styles.toolbarButtonActive : ''}`;

  return (
    <>
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
        <button onClick={addImage} className={buttonClass('image')}>
          🖼️
        </button>
        <button onClick={handleLink} className={buttonClass('link')}>
          🔗
        </button>
        <button onClick={() => setShowHtmlImport(true)} className={styles.toolbarButton}>
          HTMLインポート
        </button>
      </div>
      {showHtmlImport && (
        <HtmlImportModal
          onImport={handleHtmlImport}
          onClose={() => setShowHtmlImport(false)}
        />
      )}
    </>
  );
}
