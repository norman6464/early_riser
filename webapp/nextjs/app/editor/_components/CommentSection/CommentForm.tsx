'use client';

import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Toolbar from '../ToolBar/Toolbar';
import { editorExtensions } from '../../_lib/editorExtensions';
import styles from '../../page.module.css';

interface CommentFormProps {
  pressReleaseId?: number;
  onSubmit: (contentJson: string) => Promise<void>;
}

export function CommentForm({ pressReleaseId, onSubmit }: CommentFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: editorExtensions,
    content: '',
    immediatelyRender: false,
  });

  const handleSubmit = useCallback(async () => {
    if (!editor) return;

    const contentText = editor.getText();
    if (contentText.trim() === '') {
      alert('コメントを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const contentJson = JSON.stringify(editor.getJSON());
      await onSubmit(contentJson);
      editor.chain().focus().clearContent().run();
    } catch (error) {
      console.error('コメントの保存に失敗しました:', error);
      alert('コメントの保存に失敗しました。時間をおいて再試行してください。');
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSubmit]);

  return (
    <div className={styles.commentForm}>
      <h3 className={styles.commentInputTitle}>コメントを追加</h3>
      {!pressReleaseId && (
        <p className={styles.note}>
          下書きモード: ページをリロードするとコメントは消えます。
        </p>
      )}

      <div className={styles.commentEditorWrapper}>
        <label className={styles.editorLabel}>コメント内容</label>
        <Toolbar editor={editor} />
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
  );
}
