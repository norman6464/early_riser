'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import {
  SpellCheck, FolderOpen, BookmarkPlus, Save, Newspaper, Settings, Sparkles, MessageSquare, Lightbulb, BarChart3, FileText,
} from 'lucide-react';
import Link from 'next/link';
import Toolbar from './ToolBar/Toolbar';
import CommentSection from './CommentSection';
import { getPresignedUrl, uploadToS3 } from '@/lib/imageUpload';
import TemplateModal from './TemplateModal/TemplateModal';
import AiTemplateModal from './AiTemplateModal/AiTemplateModal';
import ProofreadModal from './ProofreadModal/ProofreadModal';
import ChatPanel from './ChatPanel/ChatPanel';
import TitleSuggestionModal from './TitleSuggestionModal/TitleSuggestionModal';
import ToneAnalysisModal from './ToneAnalysisModal/ToneAnalysisModal';
import SectionGuideModal from './SectionGuideModal/SectionGuideModal';
import type { HtmlImportData } from './HtmlImportModal/HtmlImportModal';
import styles from '../page.module.css';
import { useAutoSave } from '../_hooks/useAutoSave';
import { useBodyCount } from '../_hooks/useBodyCount';
import { useSavePressReleaseMutation } from '../_hooks/useSavePressRelease';
import { countWithoutLineBreaks } from '../_lib/validation';
import { editorExtensions } from '../_lib/editorExtensions';
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH, PRESS_RELEASE_ID } from '../_lib/constants';

interface EditorProps {
  initialTitle: string;
  initialContent: string;
}

export default function Editor({ initialTitle, initialContent }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [templateModal, setTemplateModal] = useState<'save' | 'load' | 'ai-generate' | null>(null);
  const [showProofread, setShowProofread] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTitleSuggestion, setShowTitleSuggestion] = useState(false);
  const [showToneAnalysis, setShowToneAnalysis] = useState(false);
  const [showSectionGuide, setShowSectionGuide] = useState(false);
  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      handleDrop: function (view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));

          if (files.length > 0) {
            event.preventDefault();

            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!coordinates) return false;

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

              let pos = coordinates.pos;
              successfulUploads.forEach((imageUrl) => {
                const node = view.state.schema.nodes.image.create({ src: imageUrl });
                const transaction = view.state.tr.insert(pos, node);
                view.dispatch(transaction);
                pos += node.nodeSize;
              });

              if (successfulUploads.length < files.length) {
                const failedCount = files.length - successfulUploads.length;
                alert(`${failedCount} 枚の画像のアップロードに失敗しました。`);
              }
            };

            uploadDroppedImages();
            return true;
          }
        }
        return false;
      },
    },
  });

  const { isPending, mutate } = useSavePressReleaseMutation();
  const { titleCount, bodyCount } = useBodyCount(editor, title);
  const { lastSavedRef } = useAutoSave({
    editor,
    title,
    initialTitle,
    initialContent,
    mutate,
  });

  const handleTemplateLoad = (loadedTitle: string, content: string) => {
    setTitle(loadedTitle);
    if (editor) {
      try {
        const parsed = JSON.parse(content);
        editor.chain().focus().setContent(parsed).run();
      } catch {
        editor.chain().focus().setContent(content).run();
      }
    }
  };

  const handleHtmlImport = (data: HtmlImportData) => {
    if (data.title) {
      setTitle(data.title);
    }
    if (editor && data.body) {
      editor.chain().focus().setContent(data.body).run();
    }
  };

  const handleProofreadApply = (correctedTitle: string, correctedBody: string) => {
    if (correctedTitle !== title) {
      setTitle(correctedTitle);
    }
    if (editor && correctedBody !== editor.getText()) {
      const paragraphs = correctedBody.split('\n').filter(line => line.trim() !== '');
      const content = {
        type: 'doc',
        content: paragraphs.map(p => ({
          type: 'paragraph',
          content: [{ type: 'text', text: p }],
        })),
      };
      editor.chain().focus().setContent(content).run();
    }
    setShowProofread(false);
  };

  const handleSave = () => {
    if (!editor) return;
    const currentTitleCount = countWithoutLineBreaks(title);
    const currentBodyCount = countWithoutLineBreaks(editor.getText());
    if (currentTitleCount === 0) {
      alert('タイトルを入力してください。');
      return;
    }
    if (currentBodyCount === 0) {
      alert('本文を入力してください。');
      return;
    }
    if (currentTitleCount > TITLE_MAX_LENGTH) {
      alert(`タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください。`);
      return;
    }
    if (currentBodyCount > BODY_MAX_LENGTH) {
      alert(`本文は${BODY_MAX_LENGTH}文字以内で入力してください。`);
      return;
    }
    const content = JSON.stringify(editor.getJSON());
    const currentData = JSON.stringify({ title, content });
    mutate({ title, content }, {
      onSuccess: () => {
        lastSavedRef.current = currentData;
      },
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Newspaper size={20} />
          Press Release Editor
        </h1>
        <div className={styles.headerButtons}>
          <Link href="/settings" className={styles.headerButton}>
            <Settings size={15} />
            設定
          </Link>
          <button onClick={() => setShowTitleSuggestion(true)} className={styles.headerButton}>
            <Lightbulb size={15} />
            タイトル提案
          </button>
          <button onClick={() => setShowToneAnalysis(true)} className={styles.headerButton}>
            <BarChart3 size={15} />
            トーン分析
          </button>
          <button onClick={() => setShowProofread(true)} className={styles.headerButton}>
            <SpellCheck size={15} />
            誤字修正
          </button>
          <button onClick={() => setShowSectionGuide(true)} className={styles.headerButton}>
            <FileText size={15} />
            構成ガイド
          </button>
          <button onClick={() => setTemplateModal('ai-generate')} className={styles.headerButton}>
            <Sparkles size={15} />
            AIテンプレート
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`${styles.headerButton} ${showChat ? styles.headerButtonActive : ''}`}>
            <MessageSquare size={15} />
            AIアドバイザー
          </button>
          <div className={styles.divider} />
          <button onClick={() => setTemplateModal('load')} className={styles.headerButton}>
            <FolderOpen size={15} />
            テンプレート読込
          </button>
          <button onClick={() => setTemplateModal('save')} className={styles.headerButton}>
            <BookmarkPlus size={15} />
            テンプレート保存
          </button>
          <div className={styles.divider} />
          <button onClick={handleSave} className={styles.saveButton} disabled={isPending}>
            <Save size={15} />
            {isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainContent}>
          <div className={styles.editorWrapper}>
            <div className={styles.titleInputWrapper}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトルを入力してください"
                className={styles.titleInput}
              />
              <div className={`${styles.charCount} ${titleCount > TITLE_MAX_LENGTH ? styles.charCountOver : ''}`}>
                {titleCount} / {TITLE_MAX_LENGTH}
              </div>
            </div>
            <Toolbar editor={editor} onHtmlImport={handleHtmlImport} />
            <EditorContent editor={editor} />
            <div className={`${styles.charCount} ${bodyCount > BODY_MAX_LENGTH ? styles.charCountOver : ''}`}>
              {bodyCount} / {BODY_MAX_LENGTH}
            </div>
          </div>

          <CommentSection pressReleaseId={PRESS_RELEASE_ID} />
        </div>

        {showChat && (
          <ChatPanel onClose={() => setShowChat(false)} />
        )}
      </main>

      {showProofread && editor && (
        <ProofreadModal
          title={title}
          body={editor.getText()}
          onApply={handleProofreadApply}
          onClose={() => setShowProofread(false)}
        />
      )}

      {(templateModal === 'save' || templateModal === 'load') && (
        <TemplateModal
          mode={templateModal}
          currentTitle={title}
          currentContent={editor ? JSON.stringify(editor.getJSON()) : ''}
          onLoad={handleTemplateLoad}
          onClose={() => setTemplateModal(null)}
        />
      )}

      {showSectionGuide && editor && (
        <SectionGuideModal
          currentTitle={title}
          onInsert={(text) => {
            const paragraphs = text.split('\n').filter(line => line.trim() !== '');
            const nodes = paragraphs.map(p => ({
              type: 'paragraph',
              content: [{ type: 'text', text: p }],
            }));
            editor.chain().focus().insertContentAt(editor.state.doc.content.size - 1, nodes).run();
            setShowSectionGuide(false);
          }}
          onClose={() => setShowSectionGuide(false)}
        />
      )}

      {showToneAnalysis && editor && (
        <ToneAnalysisModal
          title={title}
          bodyText={editor.getText()}
          onClose={() => setShowToneAnalysis(false)}
        />
      )}

      {showTitleSuggestion && editor && (
        <TitleSuggestionModal
          currentTitle={title}
          bodyText={editor.getText()}
          onApply={(newTitle) => {
            setTitle(newTitle);
            setShowTitleSuggestion(false);
          }}
          onClose={() => setShowTitleSuggestion(false)}
        />
      )}

      {templateModal === 'ai-generate' && (
        <AiTemplateModal
          onApply={handleTemplateLoad}
          onClose={() => setTemplateModal(null)}
        />
      )}
    </div>
  );
}
