import { useMutation } from '@tanstack/react-query';
import { API_URL,PRESS_RELEASE_ID } from '../_lib/constants';

export const  useSavePressReleaseMutation = () => {
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