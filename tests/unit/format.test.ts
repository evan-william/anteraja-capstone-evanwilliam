import { describe, expect, it } from 'vitest';

import { formatAmountInput, formatRupiah, parseRupiah } from '@/lib/format';

describe('formatRupiah', () => {
  it('memakai titik sebagai pemisah ribuan tanpa desimal', () => {
    expect(formatRupiah(1250000)).toBe('Rp1.250.000');
  });

  it('menangani nominal kecil', () => {
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(5000)).toBe('Rp5.000');
  });

  it('menangani nominal besar', () => {
    expect(formatRupiah(1234567890)).toBe('Rp1.234.567.890');
  });

  it('membuang pecahan, bukan membulatkan ke atas', () => {
    expect(formatRupiah(1500.9)).toBe('Rp1.500');
  });
});

describe('parseRupiah', () => {
  it('membaca angka dari teks berformat', () => {
    expect(parseRupiah('Rp1.250.000')).toBe(1250000);
    expect(parseRupiah('50.000')).toBe(50000);
  });

  it('mengembalikan null kalau tidak ada angka', () => {
    expect(parseRupiah('')).toBeNull();
    expect(parseRupiah('abc')).toBeNull();
  });
});

describe('formatAmountInput', () => {
  it('memformat angka untuk field input tanpa prefiks Rp', () => {
    expect(formatAmountInput(1250000)).toBe('1.250.000');
  });
});
