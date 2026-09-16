import { normalizeDescription } from './parser';
import type { ImportCategory, ParsedImportRow, PreviewImportRow } from './types';

export type MatchableTransaction = {
  id: string;
  transaction_date: string;
  amount: number;
  description: string | null;
  categories: { type: 'expense' | 'income' } | null;
};

export type CategoryRule = {
  id: string;
  category_id: string;
  keyword: string;
  type: 'expense' | 'income';
  created_at: string;
};

export function matchImportRows(
  rows: ParsedImportRow[],
  transactions: MatchableTransaction[],
  rules: CategoryRule[],
  categories: ImportCategory[],
): PreviewImportRow[] {
  const used = new Set<string>();
  const activeCategoryIds = new Set(categories.map((category) => category.id));
  const sortedRules = [...rules]
    .filter((rule) => activeCategoryIds.has(rule.category_id))
    .sort(
      (a, b) =>
        b.keyword.length - a.keyword.length ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    );

  return rows.map((row) => {
    const base = { ...row, category_id: null, matched_transaction_id: null, suggested_by_rule: null };
    if (
      row.status === 'error' ||
      !row.transaction_date ||
      !row.type ||
      !row.amount
    ) {
      return base;
    }

    const normalized = normalizeDescription(row.description);
    const match = transactions.find(
      (transaction) =>
        !used.has(transaction.id) &&
        transaction.transaction_date === row.transaction_date &&
        transaction.amount === row.amount &&
        transaction.categories?.type === row.type &&
        normalizeDescription(transaction.description) === normalized,
    );
    if (match) {
      used.add(match.id);
      return { ...base, status: 'matched', matched_transaction_id: match.id };
    }

    const rule = sortedRules.find(
      (candidate) =>
        candidate.type === row.type &&
        normalized.includes(normalizeDescription(candidate.keyword)),
    );
    return {
      ...base,
      status: 'new',
      category_id: rule?.category_id ?? null,
      suggested_by_rule: rule?.keyword ?? null,
    };
  });
}
