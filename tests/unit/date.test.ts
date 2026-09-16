import { describe, expect, it } from 'vitest';

import {
  addJakartaDays,
  formatJakartaDate,
  formatJakartaDayGroup,
  formatJakartaWeekday,
  isValidJakartaDateString,
  jakartaDateToUtc,
  toJakartaDateString,
  todayInJakarta,
} from '@/lib/date';

describe('toJakartaDateString', () => {
  it('memakai tanggal Jakarta, bukan tanggal UTC', () => {
    // 2026-09-16 18:00 UTC = 2026-09-17 01:00 WIB.
    expect(toJakartaDateString(new Date('2026-09-16T18:00:00Z'))).toBe('2026-09-17');
  });

  it('tetap di tanggal yang sama sebelum pukul 17.00 UTC', () => {
    expect(toJakartaDateString(new Date('2026-09-16T16:59:59Z'))).toBe('2026-09-16');
  });

  it('menangani pergantian tahun', () => {
    expect(toJakartaDateString(new Date('2025-12-31T17:00:00Z'))).toBe('2026-01-01');
  });
});

describe('jakartaDateToUtc', () => {
  it('memetakan awal hari Jakarta ke titik waktu UTC yang benar', () => {
    expect(jakartaDateToUtc('2026-09-17').toISOString()).toBe('2026-09-16T17:00:00.000Z');
  });

  it('bolak-balik konsisten dengan toJakartaDateString', () => {
    const localDate = '2026-02-28';
    expect(toJakartaDateString(jakartaDateToUtc(localDate))).toBe(localDate);
  });

  it('menolak tanggal yang formatnya salah', () => {
    expect(() => jakartaDateToUtc('17-09-2026')).toThrow();
  });
});

describe('todayInJakarta', () => {
  it('memakai zona Jakarta untuk menentukan "hari ini"', () => {
    expect(todayInJakarta(new Date('2026-09-16T17:30:00Z'))).toBe('2026-09-17');
  });

  it('mengembalikan format YYYY-MM-DD', () => {
    expect(todayInJakarta()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isValidJakartaDateString', () => {
  it('menerima tanggal yang benar-benar ada', () => {
    expect(isValidJakartaDateString('2024-02-29')).toBe(true);
  });

  it('menolak tanggal yang tidak ada di kalender', () => {
    expect(isValidJakartaDateString('2026-02-30')).toBe(false);
    expect(isValidJakartaDateString('2026-13-01')).toBe(false);
  });

  it('menolak format selain YYYY-MM-DD', () => {
    expect(isValidJakartaDateString('2026-9-1')).toBe(false);
    expect(isValidJakartaDateString('')).toBe(false);
  });
});

describe('formatJakartaDate', () => {
  it('menampilkan tanggal dalam Bahasa Indonesia', () => {
    expect(formatJakartaDate('2026-09-17')).toBe('17 September 2026');
  });
});

describe('addJakartaDays', () => {
  it('menyeberangi pergantian bulan', () => {
    expect(addJakartaDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addJakartaDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('menyeberangi pergantian tahun', () => {
    expect(addJakartaDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('menangani tahun kabisat', () => {
    expect(addJakartaDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('menolak tanggal yang formatnya salah', () => {
    expect(() => addJakartaDays('2026-9-1', 1)).toThrow();
  });
});

describe('formatJakartaWeekday', () => {
  it('menampilkan nama hari dalam Bahasa Indonesia', () => {
    expect(formatJakartaWeekday('2026-09-16')).toBe('Rabu');
  });
});

describe('formatJakartaDayGroup', () => {
  const today = '2026-09-16';

  it('memberi label khusus untuk hari ini', () => {
    expect(formatJakartaDayGroup(today, today)).toEqual({
      label: 'Hari ini',
      subLabel: 'Rabu, 16 September 2026',
    });
  });

  it('memberi label khusus untuk kemarin', () => {
    expect(formatJakartaDayGroup('2026-09-15', today).label).toBe('Kemarin');
  });

  it('memakai nama hari untuk tanggal lain', () => {
    expect(formatJakartaDayGroup('2026-09-13', today)).toEqual({
      label: 'Minggu',
      subLabel: '13 September 2026',
    });
  });
});
