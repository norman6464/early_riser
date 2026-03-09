'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
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
import ImageNodeView from './_components/ImageNodeView';
import LinkCard from './_components/LinkCard/linkCardExtension';
import Toolbar from './_components/ToolBar/Toolbar';
import { getPresignedUrl, uploadToS3 } from '@/lib/imageUpload';
import type { HtmlImportData } from './_components/HtmlImportModal/HtmlImportModal';
import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];

function usePressReleaseQuery() {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PressRelease> => {
      const response = await fetch(`${API_URL}/api/press-releases/${PRESS_RELEASE_ID}`);
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      return response.json();
    },
  });
}

function useSavePressReleaseMutation() {
  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await fetch(`${API_URL}/api/press-releases/${PRESS_RELEASE_ID}`, {
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


function Editor({ initialTitle, initialContent }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const titleCount = title.length;
  const [bodyCount, setBodyCount] = useState(0);
  const editor = useEditor({
    extensions: [
      Document,
      Heading,
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
        },
      }),
      Paragraph,
      Text,
      Link.configure({
        HTMLAttributes: {
          style: 'color: blue; text-decoration: underline; text-decoration-color: blue;',
        },
      }),
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Bold,
      Italic,
      LinkCard,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      handleDrop: function (view, event, slice, moved) {
        // エディタ内のテキスト移動ではなく、外部からのファイルドロップか判定
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));

          if (files.length > 0) {
            event.preventDefault();

            // ドロップされた位置の座標を取得
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!coordinates) return false;

            // 非同期で複数画像をアップロード
            const uploadDroppedImages = async () => {
              const uploadPromises = files.map(async (file) => {
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

              // 成功した画像をドロップ位置に挿入
              let pos = coordinates.pos;
              successfulUploads.forEach((imageUrl) => {
                const node = view.state.schema.nodes.image.create({ src: imageUrl });
                const transaction = view.state.tr.insert(pos, node);
                view.dispatch(transaction);
                pos += node.nodeSize; // 次の画像を挿入する位置を調整
              });

              if (successfulUploads.length < files.length) {
                const failedCount = files.length - successfulUploads.length;
                alert(`${failedCount} 枚の画像のアップロードに失敗しました。`);
              }
            };

            // アップロードを実行
            uploadDroppedImages();

            return true; // Tiptapにイベントを処理したことを伝える
          }
        }
        return false;
      },
    },
  });
  const { isPending, mutate } = useSavePressReleaseMutation();
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      title: initialTitle,
      content: JSON.stringify(initialContent),
    }),
  );

  // 5秒ごとの自動保存（変更がある場合のみ）
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      if (isPending) return;

      const currentContent = JSON.stringify(editor.getJSON());
      const currentData = JSON.stringify({ title, content: currentContent });

      if (currentData !== lastSavedRef.current) {
        mutate({ title, content: currentContent }, {
          onSuccess: () => {
            lastSavedRef.current = currentData;
          },
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [editor, title, mutate, isPending]);

  const handleHtmlImport = (data: HtmlImportData) => {
    if (data.title) {
      setTitle(data.title);
    }
    if (editor && data.body) {
      editor.chain().focus().setContent(data.body).run();
    }
  };

  const handleSave = () => {
    if (!editor) return;

    const content = JSON.stringify(editor.getJSON());
    const currentData = JSON.stringify({ title, content });
    mutate({ title, content }, {
      onSuccess: () => {
        lastSavedRef.current = currentData;
      },
    });
  };
  useEffect(() => {
    if (!editor) return;
    const updateCount = () => {
      setBodyCount(editor.getText().length);
    };

    updateCount();
    editor.on('update', updateCount);

    return () => {
      editor.off('update', updateCount);
    };
  }, [editor]);

  
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
            <div className={styles.charCount}>タイトル: {titleCount}文字</div>
          </div>
          <Toolbar editor={editor} onHtmlImport={handleHtmlImport} />
          <EditorContent editor={editor} />
          <div className={styles.charCount}>本文: {bodyCount}文字</div>
        </div>
      </main>
    </div>
  );
}
