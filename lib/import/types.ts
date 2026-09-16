import type { CategoryType } from '@/lib/supabase/types';

export type BankFormat = 'bank_a' | 'bank_b';
export type ImportRowStatus = 'new' | 'matched' | 'error';

export type ParsedImportRow = {
  row_number: number;
  fingerprint: string;
  transaction_date: string | null;
  description: string | null;
  amount: number | null;
  type: CategoryType | null;
  status: ImportRowStatus;
  error_message: string | null;
};

export type PreviewImportRow = ParsedImportRow & {
  category_id: string | null;
  matched_transaction_id: string | null;
  suggested_by_rule: string | null;
};

export type ImportCategory = {
  id: string;
  name: string;
  type: CategoryType;
};

export type ImportHistory = {
  id: string;
  file_name: string;
  bank: BankFormat;
  new_count: number;
  matched_count: number;
  error_count: number;
  status: 'completed' | 'cancelled';
  cancelled_at: string | null;
  created_at: string;
};
