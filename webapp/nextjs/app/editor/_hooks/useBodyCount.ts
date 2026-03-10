import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

export const useBodyCount = (editor: Editor | null, title: string) => {
  // ① タイトルの文字数（コンポーネントが再描画されるたびに計算されるので、useStateは不要です）
  const titleCount = title.length;

  // ② 本文の文字数（エディタの中身が変わった時だけ更新したいので、useStateで管理します）
  const [bodyCount, setBodyCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    // カウントを更新する関数
    const updateCount = () => {
      setBodyCount(editor.getText().length);
    };

    // 初期化時（マウント時）に一度カウントを実行
    updateCount();

    // エディタに文字が打ち込まれる（updateされる）たびにカウントを実行するよう設定
    editor.on('update', updateCount);

    // このコンポーネントが破棄されるときに、エディタのイベントリスナーもクリーンアップする
    return () => {
      editor.off('update', updateCount);
    };
  }, [editor]);

  // 計算した文字数をフックの呼び出し元に返す
  return { titleCount, bodyCount };
};