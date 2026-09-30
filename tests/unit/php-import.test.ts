import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const php = process.env.PHP_BIN || (existsSync('C:\\xampp\\php\\php.exe') ? 'C:\\xampp\\php\\php.exe' : 'php');
const available = spawnSync(php, ['-v'], { encoding: 'utf8' }).status === 0;

function runPhp(code: string, args: string[] = []) {
  const result = spawnSync(php, ['-r', code, ...args], { cwd: root, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

describe.skipIf(!available)('PHP import', () => {
  const parse = (name: string) => runPhp(
    "require 'server/src/Imports.php'; echo json_encode(parse_bank_csv(file_get_contents($argv[1])));",
    [path.join(root, 'docs/data', name)],
  ) as { bank: string; rows: Array<{ status: string; description: string | null; transaction_date: string | null; fingerprint: string; error_message: string | null }> };

  it('parses Bank A, preserves duplicates, and rejects fractional rupiah', () => {
    const result = parse('mutasi-bank-a.csv');
    expect(result.bank).toBe('bank_a');
    expect(result.rows).toHaveLength(10);
    expect(result.rows.filter((row) => row.status === 'new')).toHaveLength(6);
    expect(result.rows.filter((row) => row.status === 'error')).toHaveLength(4);
    const duplicates = result.rows.filter((row) => row.description === 'AUTODEBET NETFLIX');
    expect(duplicates).toHaveLength(2);
    expect(new Set(duplicates.map((row) => row.fingerprint)).size).toBe(2);
    expect(result.rows.some((row) => row.description?.includes('patungan; makan') && row.status === 'new')).toBe(true);
    expect(result.rows.some((row) => row.error_message?.includes('pecahan'))).toBe(true);
  });

  it('parses Bank B unpadded dates and blank descriptions', () => {
    const result = parse('mutasi-bank-b.csv');
    expect(result.bank).toBe('bank_b');
    expect(result.rows).toHaveLength(11);
    expect(result.rows.every((row) => row.status === 'new')).toBe(true);
    expect(result.rows.some((row) => row.transaction_date === '2026-08-16')).toBe(true);
    expect(result.rows.some((row) => row.description === null)).toBe(true);
  });

  it('rejects unknown CSV format', () => {
    const result = runPhp("require 'server/src/Http.php'; require 'server/src/Imports.php'; parse_bank_csv('foo,bar\\n1,2');");
    expect(result).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('matches a transaction once and chooses the longest category rule', () => {
    const fixtures = {
      categories: [{ id: 'cat-1', name: 'Transportasi', type: 'expense' }, { id: 'cat-2', name: 'Makanan', type: 'expense' }],
      category_rules: [
        { id: 'r1', category_id: 'cat-1', keyword: 'grab', type: 'expense', created_at: '2026-01-01' },
        { id: 'r2', category_id: 'cat-2', keyword: 'grab food', type: 'expense', created_at: '2026-02-01' },
      ],
      transactions: [{ id: 'tx-1', transaction_date: '2026-08-16', amount: 50000, description: 'grab food', categories: { type: 'expense' } }],
    };
    const rows = [1, 2, 3].map((number) => ({ row_number: number, fingerprint: `row-${number}`, transaction_date: '2026-08-16', description: '  GRAB   FOOD ', amount: 50000, type: 'expense', status: 'new', error_message: null }));
    const code = "function current_token(){return 'test';} function view_rows($table,$query,$token){return $GLOBALS['fixtures'][$table]??[];} require 'server/src/Imports.php'; $GLOBALS['fixtures']=json_decode($argv[1],true); echo json_encode(match_preview_rows(json_decode($argv[2],true),['id'=>'user-1']));";
    const result = runPhp(code, [JSON.stringify(fixtures), JSON.stringify(rows)]) as { rows: Array<{ status: string; matched_transaction_id: string | null; category_id: string | null }> };
    expect(result.rows[0]).toMatchObject({ status: 'matched', matched_transaction_id: 'tx-1' });
    expect(result.rows[1]).toMatchObject({ status: 'new', matched_transaction_id: null, category_id: 'cat-2' });
    expect(result.rows[2]).toMatchObject({ status: 'new', matched_transaction_id: null, category_id: 'cat-2' });
  });
});
