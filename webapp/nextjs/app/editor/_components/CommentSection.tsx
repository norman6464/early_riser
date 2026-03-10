'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';
import DOMPurify from 'dompurify';
import { Node } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Toolbar_comment from './ToolBar/Toolbar_comment';
import { editorExtensions } from '../_lib/editorExtensions';
import styles from '../page.module.css';
import { useComments, type Comment as FetchedComment } from '../_hooks/useComments';
import { useSaveComment } from '../_hooks/useSaveComment';

interface CommentData {
  id: number;
  content: string; // HTML or JSON string of the comment body
  createdAt: Date;
}

interface CommentSectionProps {
  pressReleaseId?: number;
}

export default function CommentSection({ pressReleaseId }: CommentSectionProps) {
  // ローカル保存用（pressReleaseId が無い場合にのみ使用）
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // サーバー連携用（pressReleaseId がある場合に有効）
  const { data: fetchedComments = [] } = useComments(pressReleaseId);
  const saveComment = useSaveComment();

  const editor = useEditor({
    extensions: editorExtensions,
    content: '',
    immediatelyRender: false,
  });

  const handleSubmit = async () => {
    if (!editor) return;

    const contentText = editor.getText();

    if (contentText.trim() === '') {
      alert('コメントを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const contentJson = JSON.stringify(editor.getJSON());

      if (pressReleaseId) {
        await saveComment.mutateAsync({ body: contentJson });
      } else {
        const newComment: CommentData = {
          id: Date.now(),
          content: contentJson,
          createdAt: new Date(),
        };
        setComments([newComment, ...comments]);
      }

      editor.chain().focus().clearContent().run();
    } catch (error) {
      console.error('コメントの保存に失敗しました:', error);
      alert('コメントの保存に失敗しました。時間をおいて再試行してください。');
    } finally {
      setIsSaving(false);
    }
  };

  // HTMLインポートはコメントでは未使用

  const renderCommentHtml = (contentString: string): string => {
    // TipTap JSON -> HTML に変換し、XSS対策でサニタイズ
    try {
      const json = JSON.parse(contentString);
      const LinkCardHtml = Node.create({
        name: 'linkCard',
        group: 'block',
        atom: true,
        addAttributes() {
          return {
            url: { default: '' },
            title: { default: '' },
            description: { default: '' },
            image: { default: '' },
          } as const;
        },
        renderHTML({ HTMLAttributes }) {
          const url = String(HTMLAttributes.url || '');
          const title = String(HTMLAttributes.title || '');
          const description = String(HTMLAttributes.description || '');
          const image = String(HTMLAttributes.image || '');
          const domain = (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return url;
            }
          })();

          const imagePart = image
            ? ['div', { class: 'clc-imageWrapper' }, ['img', { class: 'clc-image', src: image, alt: title || domain }]]
            : null;

          return [
            'a',
            { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'comment-link-card' },
            ...(imagePart ? [imagePart] : []),
            [
              'div',
              { class: 'clc-content' },
              ['div', { class: 'clc-domain' }, domain],
              title ? ['div', { class: 'clc-title' }, title] : null,
              description ? ['div', { class: 'clc-description' }, description] : null,
            ],
          ];
        },
      });
      const html = generateHTML(json, [
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        Underline,
        Link.configure({ HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
        BulletList,
        OrderedList,
        ListItem,
        Heading,
        Image,
        LinkCardHtml,
      ]);
      return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    } catch {
      // JSONでなければそのままテキストとして扱う
      return DOMPurify.sanitize(contentString);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 表示用のコメント配列を統一
  const displayComments: { id: number; content: string; createdAt: Date }[] = pressReleaseId
    ? (fetchedComments as FetchedComment[]).map((c) => ({
        id: c.id,
        content: c.body,
        createdAt: new Date(c.created_at),
      }))
    : comments;

  return (
    <div className={styles.commentSection}>
      <h2 className={styles.commentTitle}>コメント</h2>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {displayComments.length === 0 ? (
          <div className={styles.noComments}>コメントはまだありません</div>
        ) : (
          displayComments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
              </div>
              <div
                className={styles.commentBody}
                dangerouslySetInnerHTML={{ __html: renderCommentHtml(comment.content) }}
              />
            </div>
          ))
        )}
      </div>

      {/* Comment Input Form */}
      <div className={styles.commentForm}>
        <h3 className={styles.commentInputTitle}>コメントを追加</h3>
        {!pressReleaseId && (
          <p className={styles.note}>
            下書きモード: ページをリロードするとコメントは消えます。
          </p>
        )}
        


        <div className={styles.commentEditorWrapper}>
          <label className={styles.editorLabel}>コメント内容</label>
          <Toolbar_comment editor={editor} />
          <EditorContent editor={editor} className={styles.commentEditor} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving || !editor}
          className={styles.submitButton}
        >
          {isSaving ? '送信中...' : 'コメントを送信'}
        </button>
      </div>
    </div>
  );
}
