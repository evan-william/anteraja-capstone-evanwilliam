import { describe, expect, it } from 'vitest';

import { matchImportRows } from '@/lib/import/matching';
import type { ParsedImportRow } from '@/lib/import/types';

const rows: ParsedImportRow[] = [1, 2].map((occurrence) => ({
  row_number: occurrence,
  fingerprint: `bank_b|2026-08-16|expense|50000|grab food|${occurrence}`,
  transaction_date: '2026-08-16',
  description: '  GRAB   FOOD ',
  amount: 50_000,
  type: 'expense',
  status: 'new',
  error_message: null,
}));

describe('rekonsiliasi mutasi', () => {
  it('mencocokkan transaksi satu-per-satu agar duplikat tidak memakai ID yang sama', () => {
    const result = matchImportRows(
      rows,
      [{ id: 'tx-1', transaction_date: '2026-08-16', amount: 50_000, description: 'grab food', categories: { type: 'expense' } }],
      [],
      [{ id: 'cat-1', name: 'Makanan', type: 'expense' }],
    );
    expect(result[0]).toMatchObject({ status: 'matched', matched_transaction_id: 'tx-1' });
    expect(result[1]).toMatchObject({ status: 'new', matched_transaction_id: null });
  });

  it('memilih aturan terpanjang lalu aturan paling lama', () => {
    const result = matchImportRows(
      [rows[0]],
      [],
      [
        { id: 'r1', category_id: 'cat-1', keyword: 'grab', type: 'expense', created_at: '2026-01-01' },
        { id: 'r2', category_id: 'cat-2', keyword: 'grab food', type: 'expense', created_at: '2026-02-01' },
      ],
      [
        { id: 'cat-1', name: 'Transportasi', type: 'expense' },
        { id: 'cat-2', name: 'Makanan', type: 'expense' },
      ],
    );
    expect(result[0]).toMatchObject({ category_id: 'cat-2', suggested_by_rule: 'grab food' });
  });
});
