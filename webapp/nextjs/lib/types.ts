export interface PressRelease {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}

export interface Template {
  id: number;
  name: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Business {
  id: number;
  description: string;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  location: string;
  employee_count: number;
  challenge: string;
  appeal: string;
  businesses: Business[];
  created_at: string;
  updated_at: string;
}

export interface CompanyInput {
  companyName: string;
  location: string;
  employeeCount: number;
  challenge: string;
  appeal: string;
  businesses: string[];
}

export interface PressReleaseCategory {
  id: number;
  name: string;
  slug: string;
}

export interface TipTapContent {
  type: string;
  content?: TipTapNode[];
  attrs?: Record<string, any>;
}

export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  attrs?: Record<string, any>;
}
