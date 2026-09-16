import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { detectBankFormat, parseBankStatementText } from '@/lib/import/parser';

const bankAPath = fileURLToPath(new URL('../../docs/data/mutasi-bank-a.csv', import.meta.url));
const bankBPath = fileURLToPath(new URL('../../docs/data/mutasi-bank-b.csv', import.meta.url));

describe('parser mutasi bank', () => {
  it('mendeteksi format dari isi, bukan nama file', () => {
    expect(detectBankFormat(readFileSync(bankAPath, 'utf8'))).toBe('bank_a');
    expect(detectBankFormat(readFileSync(bankBPath, 'utf8'))).toBe('bank_b');
  });

  it('mengurai Bank A, mempertahankan duplikat, dan menolak pecahan', () => {
    const result = parseBankStatementText(readFileSync(bankAPath, 'utf8'));
    expect(result.bank).toBe('bank_a');
    expect(result.rows).toHaveLength(10);
    expect(result.rows.filter((row) => row.status === 'new')).toHaveLength(6);
    expect(result.rows.filter((row) => row.status === 'error')).toHaveLength(4);
    expect(result.rows.filter((row) => row.description === 'AUTODEBET NETFLIX')).toHaveLength(2);
    expect(
      result.rows.some(
        (row) => row.description?.includes('patungan; makan') && row.status === 'new',
      ),
    ).toBe(true);
    expect(result.rows.some((row) => row.status === 'error' && row.error_message?.includes('pecahan'))).toBe(true);
  });

  it('menerima tanggal tidak berpadded dan deskripsi kosong Bank B', () => {
    const result = parseBankStatementText(readFileSync(bankBPath, 'utf8'));
    expect(result.bank).toBe('bank_b');
    expect(result.rows).toHaveLength(11);
    expect(result.rows.every((row) => row.status === 'new')).toBe(true);
    expect(result.rows.some((row) => row.transaction_date === '2026-08-16')).toBe(true);
    expect(result.rows.some((row) => row.description === null && row.status === 'new')).toBe(true);
  });

  it('menolak format asing', () => {
    expect(() => parseBankStatementText('foo,bar\n1,2')).toThrow('Format tidak dikenali');
  });
});
