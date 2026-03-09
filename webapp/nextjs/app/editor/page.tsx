'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline'
import ImageNodeView from './components/ImageNodeView';
import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];

function usePressReleaseQuery() {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PressRelease> => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`);
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      return response.json();
    },
  });
}

function useSavePressReleaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      alert(`エラー: ${error.message}`);
    },
  });
}

export default function EditorPage() {
  const { data, isPending, isError } = usePressReleaseQuery();

  if (isPending) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>データの読み込みに失敗しました</div>
      </div>
    );
  }

  return <Editor initialTitle={data.title} initialContent={JSON.parse(data.content)} />;
}

interface EditorProps {
  initialTitle: string;
  initialContent: string;
}

// TODO: PHP APIに置き換える際はこのURLを変更する
const UPLOAD_API_URL = '/api/upload';

function Editor({ initialTitle, initialContent }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      Document, Heading,
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
        },
      }),
      Paragraph, Text, BulletList, OrderedList, ListItem, Bold, Italic, Underline,
    ],
    content: initialContent,
    immediatelyRender: false
  });

  const { isPending, mutate } = useSavePressReleaseMutation();

  const handleBold = () => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  };

  const handleItalic = () => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  };

  const handleUnderline = () => {
    if (!editor) return;
    editor.chain().focus().toggleUnderline().run();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

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
    }

    // 同じファイルを連続選択できるようにリセット
    e.target.value = '';
  };

  const handleSave = () => {
    if (!editor) return;

    mutate({
      title,
      content: JSON.stringify(editor.getJSON()),
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>プレスリリースエディター</h1>
        <div className={styles.headerButtons}>
          <button onClick={handleSave} className={styles.saveButton} disabled={isPending}>
            {isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.editorWrapper}>
          <div className={styles.titleInputWrapper}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力してください"
              className={styles.titleInput}
            />
          </div>
          <div className={styles.toolbar}>
            <button onClick={handleBold} className={styles.boldButton}>
              <strong>B</strong>
            </button>
            <button onClick={handleItalic} className={styles.italicButton}>
              <em>I</em>
            </button>
            <button onClick={handleUnderline} className={styles.underlineButton}>
              <u>U</u>
            </button>
            <button
              type="button"
              onClick={() => editor?.commands.toggleBulletList()}
              className={`${styles.toolbarButton} ${editor?.isActive('bulletList') ? styles.toolbarButtonActive : ''}`}
              aria-pressed={editor?.isActive('bulletList') ?? false}
            >
              箇条書き
            </button>
            <button
              type="button"
              onClick={() => editor?.commands.toggleOrderedList()}
              className={`${styles.toolbarButton} ${editor?.isActive('orderedList') ? styles.toolbarButtonActive : ''}`}
              aria-pressed={editor?.isActive('orderedList') ?? false}
            >
              番号付きリスト
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={styles.toolbarButton}>
            画像追加
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageUpload}
            hidden
          />

          </div>
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
}
