import { expect, test } from '@playwright/test';

/**
 * Happy path: daftar -> buat kategori -> tambah transaksi -> transaksi muncul di daftar.
 *
 * Butuh project Supabase yang sudah dimigrasi, dengan "Confirm email" dimatikan
 * (Authentication > Providers > Email) supaya sesi langsung terbentuk setelah daftar.
 */
test('daftar, buat kategori, lalu catat transaksi', async ({ page }) => {
  const stamp = Date.now();
  const email = `peserta+${stamp}@contoh.test`;
  const namaKategori = `Jajan ${stamp}`;

  await page.goto('/daftar');
  await page.getByLabel('Nama').fill('Peserta Training');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('rahasia12345');
  await page.getByRole('button', { name: 'Daftar' }).click();

  await expect(page).toHaveURL(/\/transaksi$/);

  await page.getByRole('link', { name: 'Kategori' }).click();
  await expect(page).toHaveURL(/\/kategori$/);

  await page.getByLabel('Nama kategori').fill(namaKategori);
  await page.getByLabel('Jenis').selectOption('expense');
  await page.getByRole('button', { name: 'Tambah' }).click();

  await expect(page.getByText(namaKategori)).toBeVisible();

  await page.getByRole('link', { name: 'Transaksi' }).click();
  await expect(page).toHaveURL(/\/transaksi$/);

  await page.getByLabel('Kategori').selectOption({ label: `${namaKategori} (pengeluaran)` });
  await page.getByLabel('Nominal (Rp)').fill('75000');
  await page.getByLabel('Deskripsi (opsional)').fill('Kopi sore');
  await page.getByRole('button', { name: 'Tambah transaksi' }).click();

  await expect(page.getByText('Kopi sore')).toBeVisible();
  await expect(page.getByTestId('transaction-amount').first()).toHaveText('Rp75.000');
});
