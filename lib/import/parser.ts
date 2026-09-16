import Papa, { type ParseError, type ParseResult } from 'papaparse';

import type { BankFormat, ParsedImportRow } from './types';

export const MAX_IMPORT_ROWS = 50_000;
export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

const BANK_A_HEADER = 'Tanggal;Keterangan;Debet/Kredit;Nominal;Saldo';
const BANK_B_HEADER = 'date,description,amount,balance';

function cleanBeginning(value: string): string {
  return value.replace(/^\uFEFF/, '').replace(/^\\xef\\xbb\\xbf/i, '');
}

export function detectBankFormat(sample: string): BankFormat {
  const cleaned = cleanBeginning(sample);
  if (cleaned.includes(BANK_A_HEADER)) return 'bank_a';
  if (cleaned.includes(BANK_B_HEADER)) return 'bank_b';
  throw new Error('Format tidak dikenali. Gunakan CSV Bank A atau Bank B sesuai contoh.');
}

function parseDate(value: string, bank: BankFormat): string | null {
  const match = value
    .trim()
    .match(bank === 'bank_a' ? /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ : /^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(bank === 'bank_a' ? match[3] : match[1]);
  const month = Number(match[2]);
  const day = Number(bank === 'bank_a' ? match[1] : match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

export function normalizeDescription(value: string | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
}

function parseBankAMoney(value: string): number | null {
  const compact = value.trim().replace(/\s/g, '');
  if (compact === '') return 0;
  const match = compact.match(/^([0-9]{1,3}(?:\.[0-9]{3})*|[0-9]+)(?:,([0-9]{2}))?$/);
  if (!match || (match[2] && match[2] !== '00')) return null;
  const amount = Number(match[1].replace(/\./g, ''));
  return Number.isSafeInteger(amount) ? amount : null;
}

function parseBankBMoney(value: string): number | null {
  const compact = value.trim();
  if (!/^[+-]?\d+$/.test(compact)) return null;
  const amount = Number(compact);
  return Number.isSafeInteger(amount) && amount !== 0 ? amount : null;
}

function fingerprint(
  bank: BankFormat,
  date: string,
  type: 'expense' | 'income',
  amount: number,
  description: string | null,
  occurrence: number,
): string {
  return [bank, date, type, amount, normalizeDescription(description), occurrence].join('|');
}

function parserErrorMessage(errors: ParseError[], row: number): string | null {
  const error = errors.find((item) => item.row === row);
  return error ? `CSV tidak valid: ${error.message}` : null;
}

function mapRows(result: ParseResult<string[]>, bank: BankFormat): ParsedImportRow[] {
  const occurrences = new Map<string, number>();
  const rows: ParsedImportRow[] = [];

  for (let index = 1; index < result.data.length; index += 1) {
    let cells = result.data[index] ?? [];
    if (cells.every((cell) => cell.trim() === '')) continue;

    const rowNumber = index + 1 + (bank === 'bank_a' ? 4 : 0);
    if (bank === 'bank_a') {
      // Contoh Bank A berisi titik koma di tengah keterangan berpetik yang tidak
      // sepenuhnya RFC-CSV. Tiga kolom terakhir selalu kode, nominal, dan saldo.
      if (cells.length > 5) {
        cells = [cells[0], cells.slice(1, -3).join(';'), ...cells.slice(-3)];
      }
      if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test((cells[0] ?? '').trim())) continue;
      if ((cells[1] ?? '').trim().toLocaleUpperCase('id-ID') === 'SALDO AWAL') continue;
    }
    const csvError = parserErrorMessage(result.errors, index);
    const date = parseDate(cells[0] ?? '', bank);
    const description = (cells[1] ?? '').trim() || null;
    let amount: number | null = null;
    let type: 'expense' | 'income' | null = null;
    let errorMessage = csvError;

    if (!date) errorMessage ??= 'Tanggal tidak valid.';

    if (bank === 'bank_a') {
      const direction = (cells[2] ?? '').trim().toLocaleUpperCase('id-ID');
      const parsedAmount = parseBankAMoney(cells[3] ?? '');
      if (parsedAmount === null) {
        errorMessage ??= 'Nominal harus rupiah utuh; pecahan tidak dibulatkan.';
      } else if (!['DB', 'CR'].includes(direction) || parsedAmount === 0) {
        errorMessage ??= 'Kode Debet/Kredit harus DB atau CR dan nominal harus positif.';
      } else {
        type = direction === 'DB' ? 'expense' : 'income';
        amount = parsedAmount;
      }
    } else {
      const signedAmount = parseBankBMoney(cells[2] ?? '');
      if (signedAmount === null) {
        errorMessage ??= 'Amount harus bilangan bulat selain nol.';
      } else {
        type = signedAmount < 0 ? 'expense' : 'income';
        amount = Math.abs(signedAmount);
      }
    }

    if (errorMessage || !date || !type || !amount) {
      rows.push({
        row_number: rowNumber,
        fingerprint: `${bank}|error|${rowNumber}`,
        transaction_date: date,
        description,
        amount,
        type,
        status: 'error',
        error_message: errorMessage ?? 'Baris tidak valid.',
      });
      continue;
    }

    const base = [bank, date, type, amount, normalizeDescription(description)].join('|');
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);
    rows.push({
      row_number: rowNumber,
      fingerprint: fingerprint(bank, date, type, amount, description, occurrence),
      transaction_date: date,
      description,
      amount,
      type,
      status: 'new',
      error_message: null,
    });
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Maksimal ${MAX_IMPORT_ROWS.toLocaleString('id-ID')} baris per file.`);
  }
  return rows;
}

function prepareContent(text: string, bank: BankFormat): string {
  const cleaned = cleanBeginning(text);
  if (bank === 'bank_a') {
    const headerIndex = cleaned.indexOf(BANK_A_HEADER);
    return cleaned.slice(headerIndex);
  }
  return cleaned;
}

export function parseBankStatementText(text: string): { bank: BankFormat; rows: ParsedImportRow[] } {
  const bank = detectBankFormat(text.slice(0, 8_192));
  const result = Papa.parse<string[]>(prepareContent(text, bank), {
    delimiter: bank === 'bank_a' ? ';' : ',',
    skipEmptyLines: 'greedy',
  });
  return { bank, rows: mapRows(result, bank) };
}

export async function parseBankStatementFile(
  file: File,
): Promise<{ bank: BankFormat; rows: ParsedImportRow[] }> {
  if (file.size > MAX_IMPORT_FILE_SIZE) throw new Error('Ukuran file maksimal 10 MB.');
  const sample = await file.slice(0, 8_192).text();
  const bank = detectBankFormat(sample);

  // Parsing besar dijalankan oleh Web Worker bawaan Papa Parse agar UI tetap responsif.
  const parseFile = (input: File) =>
    new Promise<ParseResult<string[]>>((resolve, reject) => {
      Papa.parse<string[]>(input, {
        worker: true,
        delimiter: bank === 'bank_a' ? ';' : ',',
        skipEmptyLines: 'greedy',
        ...(bank === 'bank_a' ? { skipFirstNLines: 4 } : {}),
        complete: resolve,
        error: (error) => reject(error),
      });
    });

  return { bank, rows: mapRows(await parseFile(file), bank) };
}
