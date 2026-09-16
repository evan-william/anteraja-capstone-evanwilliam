const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * 1250000 -> "Rp1.250.000"
 */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(Math.trunc(amount)).replace(/ /g, '');
}

/**
 * "Rp1.250.000" atau "1.250.000" -> 1250000. Mengembalikan null bila tidak ada angka.
 */
export function parseRupiah(input: string): number | null {
  const digits = input.replace(/[^\d]/g, '');
  if (digits === '') return null;
  return Number.parseInt(digits, 10);
}

/**
 * Format angka untuk ditampilkan di input nominal: 1250000 -> "1.250.000".
 */
export function formatAmountInput(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.trunc(amount));
}
