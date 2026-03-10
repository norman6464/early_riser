'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline,
  List, ListOrdered,
  ImagePlus, ImageIcon,
  Link2, LayoutPanelLeft,
  FileCode2,
} from 'lucide-react';
import { getPresignedUrl, uploadToS3 } from '@/lib/imageUpload';
import HtmlImportModal, { type HtmlImportData } from '../HtmlImportModal/HtmlImportModal';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  editor: Editor | null;
  onHtmlImport: (data: HtmlImportData) => void;
}

export default function Toolbar({ editor, onHtmlImport }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHtmlImport, setShowHtmlImport] = useState(false);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const { uploadUrl, imageUrl } = await getPresignedUrl(file.type, file.name);
        await uploadToS3(uploadUrl, file);
        return imageUrl;
      } catch (error) {
        console.error(`画像 "${file.name}" のアップロードに失敗しました:`, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((url): url is string => url !== null);

    successfulUploads.forEach((imageUrl) => {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    });

    if (successfulUploads.length < files.length) {
      const failedCount = files.length - successfulUploads.length;
      alert(`${failedCount} 枚の画像のアップロードに失敗しました。`);
    }

    e.target.value = '';
  };

  const addImage = () => {
    const url = prompt('画像URLを入力してください');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleLink = () => {
    const url = prompt('リンクURLを入力してください');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleLinkCard = async () => {
    const url = prompt('リンクカードのURLを入力してください');
    if (!url) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_URL}/api/ogp?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        alert('OGP情報の取得に失敗しました。');
        return;
      }
      const ogpData = await response.json();
      editor.chain().focus().insertContent([
        {
          type: 'linkCard',
          attrs: {
            url: ogpData.url,
            title: ogpData.title || '',
            description: ogpData.description || '',
            image: ogpData.image || '',
          },
        },
        { type: 'paragraph' },
      ]).run();
    } catch (error) {
      console.error('リンクカードの挿入に失敗しました:', error);
      alert('リンクカードの挿入に失敗しました。');
    }
  };

  const btnClass = (name: string) =>
    `${styles.toolbarButton} ${editor.isActive(name) ? styles.toolbarButtonActive : ''}`;

  const iconSize = 16;

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass('bold')} title="太字">
            <Bold size={iconSize} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass('italic')} title="斜体">
            <Italic size={iconSize} />
          </button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass('underline')} title="下線">
            <Underline size={iconSize} />
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass('bulletList')} title="箇条書き">
            <List size={iconSize} />
          </button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass('orderedList')} title="番号リスト">
            <ListOrdered size={iconSize} />
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button onClick={() => fileInputRef.current?.click()} className={styles.toolbarButton} title="画像アップロード">
            <ImagePlus size={iconSize} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleImageUpload}
            hidden
          />
          <button onClick={addImage} className={styles.toolbarButton} title="画像URL挿入">
            <ImageIcon size={iconSize} />
          </button>
          <button onClick={handleLink} className={btnClass('link')} title="リンク">
            <Link2 size={iconSize} />
          </button>
          <button onClick={handleLinkCard} className={styles.toolbarButton} title="リンクカード">
            <LayoutPanelLeft size={iconSize} />
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <button onClick={() => setShowHtmlImport(true)} className={styles.toolbarButtonWide} title="HTMLインポート">
          <FileCode2 size={14} />
          <span>HTML</span>
        </button>
      </div>
      {showHtmlImport && (
        <HtmlImportModal
          onImport={onHtmlImport}
          onClose={() => setShowHtmlImport(false)}
        />
      )}
    </>
  );
}
