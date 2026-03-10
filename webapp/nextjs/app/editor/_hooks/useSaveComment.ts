import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL,PRESS_RELEASE_ID } from '../_lib/constants';

export interface SaveCommentInput {
  body: string;
}

export function useSaveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveCommentInput) => {
      const response = await fetch(`${API_URL}/api/comments/${PRESS_RELEASE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: data.body,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', PRESS_RELEASE_ID] });
    },
  });
}
