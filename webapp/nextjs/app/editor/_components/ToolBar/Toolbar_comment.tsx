'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { getPresignedUrl, uploadToS3 } from '@/lib/imageUpload';
import styles from './Toolbar.module.css';


interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [, forceRerender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;
    const rerender = () => forceRerender();
    editor.on('selectionUpdate', rerender);
    editor.on('transaction', rerender);
    editor.on('update', rerender);
    editor.on('focus', rerender);
    editor.on('blur', rerender);
    return () => {
      editor.off('selectionUpdate', rerender);
      editor.off('transaction', rerender);
      editor.off('update', rerender);
      editor.off('focus', rerender);
      editor.off('blur', rerender);
    };
  }, [editor]);

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

  const openFilePicker = () => {
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

  const buttonClass = (name: string) => {
    const hasSelection = !editor.state.selection.empty;
    const isActive = hasSelection && editor.isActive(name);
    return `${styles.toolbarButton} ${isActive ? styles.toolbarButtonActive : ''}`;
  };

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
        <div
          className={styles.dropdownWrapper}
          onBlur={() => setTimeout(() => setShowImageMenu(false), 100)}
          tabIndex={0}
        >
          <button
            onClick={() => setShowImageMenu((v) => !v)}
            className={styles.toolbarButton}
            aria-haspopup="menu"
            aria-expanded={showImageMenu}
          >
            画像追加
          </button>
          {showImageMenu && (
            <div role="menu" className={styles.dropdown}>
              <button role="menuitem" className={styles.dropdownItem} onClick={() => { openFilePicker(); setShowImageMenu(false); }}>
                ファイルから追加
              </button>
              <button role="menuitem" className={styles.dropdownItem} onClick={() => { addImage(); setShowImageMenu(false); }}>
                URL から追加
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleImageUpload}
            hidden
          />
        </div>
        <button onClick={handleLink} className={buttonClass('link')}>
          🔗
        </button>
        <button onClick={handleLinkCard} className={styles.toolbarButton}>
          リンクカード
        </button>
      </div>
    </>
  );
}
