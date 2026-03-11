import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { countWithoutLineBreaks } from '../_lib/validation';
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH } from '../_lib/constants';

// デバウンス待機時間（ミリ秒）
const DEBOUNCE_MS = 300;

// フックが受け取る引数の型を定義
interface UseAutoSaveProps {
  editor: Editor | null;
  title: string;
  initialTitle: string;
  initialContent: string;
  mutate: (data: { title: string; content: string }, options?: { onSuccess?: () => void }) => void;
}

export const useAutoSave = ({
  editor,
  title,
  initialTitle,
  initialContent,
  mutate,
}: UseAutoSaveProps) => {
  // 最後に保存したデータ
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      title: initialTitle,
      content: typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent),
    })
  );

  // 最新のタイトルを保持するRef
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 差分チェック＋保存を実行する関数
  const trySave = useCallback(() => {
    if (!editor) return;

    const currentTitle = titleRef.current;
    const currentContent = JSON.stringify(editor.getJSON());

    const currentTitleCount = countWithoutLineBreaks(currentTitle);
    const currentBodyCount = countWithoutLineBreaks(editor.getText());

    // バリデーション：空や上限超過の場合は保存しない
    if (currentTitleCount === 0 || currentBodyCount === 0) return;
    if (currentTitleCount > TITLE_MAX_LENGTH || currentBodyCount > BODY_MAX_LENGTH) return;

    const currentData = JSON.stringify({ title: currentTitle, content: currentContent });

    // 差分がなければスキップ
    if (currentData === lastSavedRef.current) return;

    mutate(
      { title: currentTitle, content: currentContent },
      {
        onSuccess: () => {
          lastSavedRef.current = currentData;
        },
      }
    );
  }, [editor, mutate]);

  // デバウンス付きで保存をスケジュールする関数
  const scheduleSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      trySave();
      timerRef.current = null;
    }, DEBOUNCE_MS);
  }, [trySave]);

  // エディタ本文の変更を検知して即座に保存をスケジュール
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      scheduleSave();
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, scheduleSave]);

  // タイトル変更を検知して保存をスケジュール
  useEffect(() => {
    scheduleSave();
  }, [title, scheduleSave]);

  // アンマウント時にタイマーをクリアし、未保存の変更があれば保存
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      trySave();
    };
  }, [trySave]);

  return { lastSavedRef };
};
