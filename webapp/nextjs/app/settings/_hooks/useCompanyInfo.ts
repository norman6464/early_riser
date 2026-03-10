'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Company, CompanyInput } from '@/lib/types';
import { API_URL, COMPANY_ID } from '@/app/editor/_lib/constants';

export function useCompanyQuery() {
  return useQuery({
    queryKey: ['company', COMPANY_ID],
    queryFn: async (): Promise<Company | null> => {
      const res = await fetch(`${API_URL}/api/companies/${COMPANY_ID}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('企業情報の取得に失敗しました');
      return res.json();
    },
  });
}

function buildPayload(data: CompanyInput) {
  return {
    name: data.companyName,
    location: data.location,
    employee_count: data.employeeCount,
    appeal: data.appeal,
    challenge: data.challenge,
    businesses: data.businesses.map((d) => ({ description: d })),
  };
}

export function useCreateCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompanyInput): Promise<Company> => {
      const res = await fetch(`${API_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data)),
      });
      if (!res.ok) throw new Error('企業情報の作成に失敗しました');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['company', COMPANY_ID], data);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });
}

export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompanyInput): Promise<Company> => {
      const res = await fetch(`${API_URL}/api/companies/${COMPANY_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data)),
      });
      if (!res.ok) throw new Error('企業情報の更新に失敗しました');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['company', COMPANY_ID], data);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });
}


