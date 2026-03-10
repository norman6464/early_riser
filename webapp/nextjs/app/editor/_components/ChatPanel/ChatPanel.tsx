'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useChat, type ChatMessage } from '../../_hooks/useChat';
import { PRESS_RELEASE_ID } from '../../_lib/constants';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, isSending, isLoading, sendMessage } = useChat(PRESS_RELEASE_ID);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中（isComposing）はEnterで送信しない
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  // テキストエリアの高さを自動調整
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

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

      <div className={styles.messageList}>
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
            <div
              key={msg.id ?? `stream-${i}`}
              className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
            >
              <div className={styles.messageBubble}>
                {msg.content || (
                  <div className={styles.loadingDots}>
                    <span /><span /><span />
                  </div>
                )}
              </div>
              {msg.created_at && (
                <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
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
