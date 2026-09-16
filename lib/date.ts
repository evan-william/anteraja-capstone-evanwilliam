export const APP_TIME_ZONE = 'Asia/Jakarta';

/** Asia/Jakarta tidak mengenal DST, offsetnya tetap UTC+7. */
const JAKARTA_OFFSET_MINUTES = 7 * 60;

const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const jakartaDisplayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Date (titik waktu UTC) -> tanggal lokal Jakarta dalam format `YYYY-MM-DD`.
 */
export function toJakartaDateString(date: Date): string {
  return jakartaDateFormatter.format(date);
}

/**
 * Tanggal lokal Jakarta (`YYYY-MM-DD`) -> titik waktu UTC pada awal hari tersebut.
 * Nilai inilah yang aman disimpan sebagai `timestamptz`.
 */
export function jakartaDateToUtc(localDate: string): Date {
  if (!isValidJakartaDateString(localDate)) {
    throw new Error(`Tanggal tidak valid: ${localDate}`);
  }
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day) - JAKARTA_OFFSET_MINUTES * 60_000);
}

/**
 * Tanggal hari ini menurut Asia/Jakarta, format `YYYY-MM-DD`.
 */
export function todayInJakarta(now: Date = new Date()): string {
  return toJakartaDateString(now);
}

/**
 * `YYYY-MM-DD` -> "16 September 2026" untuk ditampilkan ke pengguna.
 */
export function formatJakartaDate(localDate: string): string {
  return jakartaDisplayFormatter.format(jakartaDateToUtc(localDate));
}

/**
 * Cek format `YYYY-MM-DD` sekaligus memastikan tanggalnya benar-benar ada.
 */
export function isValidJakartaDateString(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

const jakartaWeekdayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: APP_TIME_ZONE,
  weekday: 'long',
});

/**
 * `YYYY-MM-DD` -> "Rabu".
 */
export function formatJakartaWeekday(localDate: string): string {
  return jakartaWeekdayFormatter.format(jakartaDateToUtc(localDate));
}

/**
 * Geser tanggal lokal Jakarta sejumlah hari. Aman melewati batas bulan dan tahun.
 */
export function addJakartaDays(localDate: string, days: number): string {
  if (!isValidJakartaDateString(localDate)) {
    throw new Error(`Tanggal tidak valid: ${localDate}`);
  }
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export type JakartaDayGroup = {
  /** "Hari ini", "Kemarin", atau nama hari. */
  label: string;
  /** Tanggal lengkap sebagai keterangan pendamping. */
  subLabel: string;
};

/**
 * Label untuk header grup tanggal di riwayat transaksi.
 * Hari ini dan kemarin diberi nama khusus supaya lebih cepat dikenali.
 */
export function formatJakartaDayGroup(
  localDate: string,
  today: string = todayInJakarta(),
): JakartaDayGroup {
  const fullDate = formatJakartaDate(localDate);
  const weekday = formatJakartaWeekday(localDate);

  if (localDate === today) {
    return { label: 'Hari ini', subLabel: `${weekday}, ${fullDate}` };
  }
  if (localDate === addJakartaDays(today, -1)) {
    return { label: 'Kemarin', subLabel: `${weekday}, ${fullDate}` };
  }
  return { label: weekday, subLabel: fullDate };
}
