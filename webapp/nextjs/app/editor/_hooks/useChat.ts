'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * チャット履歴を取得する
 */
function useChatHistory(pressReleaseId: number) {
  return useQuery<ChatMessage[]>({
    queryKey: ['chatHistory', pressReleaseId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/${pressReleaseId}/history`);
      if (!res.ok) throw new Error('Failed to fetch chat history');
      const data = await res.json();
      return data.messages;
    },
  });
}

/**
 * AIチャット機能を提供するhook
 * SSEストリーミングでリアルタイム応答を受信する
 */
export function useChat(pressReleaseId: number) {
  const { data: history = [], isLoading } = useChatHistory(pressReleaseId);
  const [streamingMessages, setStreamingMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  // 表示用メッセージ = DB履歴 + ストリーミング中のメッセージ
  const messages = [...history, ...streamingMessages];

  const sendMessage = useCallback(async (message: string) => {
    if (isSending || !message.trim()) return;

    setIsSending(true);

    // ユーザーメッセージを即座に表示
    const userMsg: ChatMessage = { role: 'user', content: message };
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setStreamingMessages([userMsg, assistantMsg]);

    try {
      abortRef.current = new AbortController();

      const res = await fetch(`${API_URL}/api/chat/${pressReleaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error('Chat error:', parsed.message);
              accumulatedContent += `\n[Error: ${parsed.message}]`;
            } else if (parsed.content) {
              accumulatedContent += parsed.content;
            }
          } catch {
            // JSONパース失敗は無視
          }
        }

        // ストリーミング中のassistantメッセージを更新
        setStreamingMessages([
          userMsg,
          { role: 'assistant', content: accumulatedContent },
        ]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // ユーザーがキャンセルした
      } else {
        console.error('Chat error:', err);
      }
    } finally {
      setIsSending(false);
      setStreamingMessages([]);
      abortRef.current = null;
      // DB履歴を再取得
      queryClient.invalidateQueries({ queryKey: ['chatHistory', pressReleaseId] });
    }
  }, [isSending, pressReleaseId, queryClient]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isSending,
    isLoading,
    sendMessage,
    cancelStream,
  };
}
