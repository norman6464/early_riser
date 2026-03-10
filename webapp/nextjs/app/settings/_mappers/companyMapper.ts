import type { CompanyFormValues } from '../_schemas/companyInfoSchema';

export function toCompanyPayload(data: CompanyFormValues) {
  return {
    name: data.companyName,
    location: data.location,
    employee_count: data.employeeCount,
    appeal: data.appeal,
    challenge: data.challenge,
    businesses: data.businesses.map((d) => ({ description: d.value })),
  };
}
