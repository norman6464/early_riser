'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useChat, type ChatMessage } from '../../_hooks/useChat';
import { markdownToHtml } from '../../_lib/markdownRenderer';
import { PRESS_RELEASE_ID } from '../../_lib/constants';
import styles from './ChatPanel.module.css';
import { formatTime } from '../../_lib/formatTime';

interface ChatPanelProps {
  onClose: () => void;
}



const MessageItem = memo(function MessageItem({ msg, index }: { msg: ChatMessage; index: number }) {
  return (
    <div
      key={msg.id ?? `stream-${index}`}
      className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
    >
      <div className={styles.messageBubble}>
        {!msg.content ? (
          <div className={styles.loadingDots}>
            <span /><span /><span />
          </div>
        ) : msg.role === 'assistant' ? (
          <div
            className={styles.markdownContent}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
          />
        ) : (
          msg.content
        )}
      </div>
      {msg.created_at && (
        <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
      )}
    </div>
  );
});

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, isSending, isLoading, sendMessage } = useChat(PRESS_RELEASE_ID);
  const [input, setInput] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メッセージが追加されたらメッセージリスト内のみスクロール
  useEffect(() => {
    const el = messageListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    setInput((prev) => {
      if (!prev.trim() || isSending) return prev;
      sendMessage(prev.trim());
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      return '';
    });
  }, [isSending, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // IME変換中（isComposing）はEnterで送信しない
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // テキストエリアの高さを自動調整
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <MessageSquare size={16} className={styles.headerIcon} />
          AI アドバイザー
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={16} />
        </button>
      </div>

      <div ref={messageListRef} className={styles.messageList}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.loadingDots}>
              <span /><span /><span />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={32} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              プレスリリースの作成について<br />
              何でもご相談ください
            </p>
          </div>
        ) : (
          messages.map((msg: ChatMessage, i: number) => (
            <MessageItem key={msg.id ?? `stream-${i}`} msg={msg} index={i} />
          ))
        )}
      </div>

      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          rows={1}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          className={styles.sendButton}
          disabled={isSending || !input.trim()}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
