'use client';

import { useQuery } from '@tanstack/react-query';
import type { PressReleaseCategory } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['press-release-categories'],
    queryFn: async (): Promise<PressReleaseCategory[]> => {
      // TODO: Replace with actual API call
      // const res = await fetch(`${API_URL}/api/press-release-categories`);
      // if (!res.ok) throw new Error('カテゴリの取得に失敗しました');
      // return res.json();

      // Mock
      return [
        { id: 1, name: '新商品の開発', slug: 'new-product' },
        { id: 2, name: '採用', slug: 'recruitment' },
        { id: 3, name: '自社のストーリー', slug: 'company-story' },
        { id: 4, name: 'イベント・キャンペーン', slug: 'event-campaign' },
      ];
    },
  });
}
