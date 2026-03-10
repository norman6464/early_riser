import { z } from 'zod';

export const companySchema = z.object({
  companyName: z.string().min(1, '会社名を入力してください'),
  location: z.string(),
  employeeCount: z.number(),
  challenge: z.string(),
  appeal: z.string(),
  businesses: z.array(z.object({ value: z.string() })),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
