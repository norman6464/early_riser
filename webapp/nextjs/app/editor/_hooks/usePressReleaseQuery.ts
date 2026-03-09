import { useQuery } from '@tanstack/react-query';
import type { PressRelease } from '@/lib/types';
import { API_URL,queryKey,PRESS_RELEASE_ID } from '../_lib/constants';

export const usePressReleaseQuery = () => {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PressRelease> => {
      const response = await fetch(`${API_URL}/api/press-releases/${PRESS_RELEASE_ID}`);
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      return response.json();
    },
  });
}