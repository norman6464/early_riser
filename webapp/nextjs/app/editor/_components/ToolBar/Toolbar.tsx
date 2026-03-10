'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Heading2, Heading3,
  Bold, Italic, Underline,
  List, ListOrdered,
  ImagePlus, ImageIcon,
  Link2, LayoutPanelLeft,
  FileCode2,
} from 'lucide-react';
import { getPresignedUrl, uploadToS3 } from '@/lib/imageUpload';
import HtmlImportModal, { type HtmlImportData } from '../HtmlImportModal/HtmlImportModal';
import Tooltip from '../Tooltip/Tooltip';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  editor: Editor | null;
  onHtmlImport?: (data: HtmlImportData) => void;
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

  const btnClass = (name: string, attrs?: Record<string, unknown>) =>
    `${styles.toolbarButton} ${editor.isActive(name, attrs) ? styles.toolbarButtonActive : ''}`;

  const iconSize = 16;

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Tooltip label="見出し2">
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass('heading', { level: 2 })}>
              <Heading2 size={iconSize} />
            </button>
          </Tooltip>
          <Tooltip label="見出し3">
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass('heading', { level: 3 })}>
              <Heading3 size={iconSize} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip label="太字">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass('bold')}>
              <Bold size={iconSize} />
            </button>
          </Tooltip>
          <Tooltip label="斜体">
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass('italic')}>
              <Italic size={iconSize} />
            </button>
          </Tooltip>
          <Tooltip label="下線">
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass('underline')}>
              <Underline size={iconSize} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip label="箇条書き">
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass('bulletList')}>
              <List size={iconSize} />
            </button>
          </Tooltip>
          <Tooltip label="番号付きリスト">
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass('orderedList')}>
              <ListOrdered size={iconSize} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip label="画像アップロード">
            <button onClick={() => fileInputRef.current?.click()} className={styles.toolbarButton}>
              <ImagePlus size={iconSize} />
            </button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleImageUpload}
            hidden
          />
          <Tooltip label="画像URL挿入">
            <button onClick={addImage} className={styles.toolbarButton}>
              <ImageIcon size={iconSize} />
            </button>
          </Tooltip>
          <Tooltip label="リンク">
            <button onClick={handleLink} className={btnClass('link')}>
              <Link2 size={iconSize} />
            </button>
          </Tooltip>
          <Tooltip label="リンクカード">
            <button onClick={handleLinkCard} className={styles.toolbarButton}>
              <LayoutPanelLeft size={iconSize} />
            </button>
          </Tooltip>
        </div>

        {onHtmlImport && (
          <>
            <div className={styles.toolbarDivider} />
            <Tooltip label="HTMLインポート">
              <button onClick={() => setShowHtmlImport(true)} className={styles.toolbarButtonWide}>
                <FileCode2 size={14} />
                <span>HTML</span>
              </button>
            </Tooltip>
          </>
        )}
      </div>
      {onHtmlImport && showHtmlImport && (
        <HtmlImportModal
          onImport={onHtmlImport}
          onClose={() => setShowHtmlImport(false)}
        />
      )}
    </>
  );
}
