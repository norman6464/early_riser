import { useQuery } from '@tanstack/react-query';
import { API_URL, PRESS_RELEASE_ID } from '../_lib/constants';

export interface Comment {
  id: number;
  press_release_id: number;
  body: string;
  created_at: string;
  updated_at: string;
}

export function useComments(pressReleaseId?: number) {
  return useQuery({
    queryKey: ['comments', pressReleaseId],
    queryFn: async () => {
      if (!pressReleaseId) return [];
      const response = await fetch(`${API_URL}/api/comments/${PRESS_RELEASE_ID}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const json = await response.json();
      const list = Array.isArray(json) ? json : json?.comments;
      const items = (Array.isArray(list) ? list : []) as Comment[];
      // Ensure newest-first order (created_at DESC)
      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!pressReleaseId,
  });
}
