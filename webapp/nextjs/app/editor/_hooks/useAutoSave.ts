import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { countWithoutLineBreaks } from '../_lib/validation';
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH } from '../_lib/constants';

// フックが受け取る引数の型を定義
interface UseAutoSaveProps {
  editor: Editor | null;
  title: string;
  initialTitle: string;
  initialContent: string;
  mutate: (data: { title: string; content: string }, options?: any) => void;
}

export const useAutoSave = ({
  editor,
  title,
  initialTitle,
  initialContent,
  mutate,
}: UseAutoSaveProps) => {
  // 最後に保存したデータ（フック内で管理）
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      title: initialTitle,
      content: typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent),
    })
  );

  // 最新のタイトルを保持するRef（これもフック内で管理）
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  // 5秒ごとの自動保存
  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      const currentTitle = titleRef.current;
      const currentContent = JSON.stringify(editor.getJSON());

      const currentTitleCount = countWithoutLineBreaks(currentTitle);
      const currentBodyCount = countWithoutLineBreaks(editor.getText());

      if (currentTitleCount === 0 || currentBodyCount === 0) return;
      if (currentTitleCount > TITLE_MAX_LENGTH || currentBodyCount > BODY_MAX_LENGTH) return;

      const currentData = JSON.stringify({ title: currentTitle, content: currentContent });

      if (currentData !== lastSavedRef.current) {
        mutate(
          { title: currentTitle, content: currentContent },
          {
            onSuccess: () => {
              lastSavedRef.current = currentData;
            },
          }
        );
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [editor, mutate]);

  // 手動保存時（handleSave）でもlastSavedRefを更新できるように、フックから返しておく
  return { lastSavedRef };
};