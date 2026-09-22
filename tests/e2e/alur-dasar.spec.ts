import { expect, test } from '@playwright/test';

/**
 * Happy path dasar: akun demo terverifikasi masuk -> buat kategori
 * -> tambah transaksi -> transaksi muncul di daftar.
 * Registrasi email dikonfirmasi secara terpisah karena layanan email cloud memiliki rate limit.
 */
test('masuk, buat kategori, lalu catat transaksi', async ({ page }) => {
  const stamp = Date.now();
  const namaKategori = `Jajan ${stamp}`;

  await page.goto('/masuk');
  await page.getByLabel('Email').fill('demo@contoh.test');
  await page.getByLabel('Password').fill('demo12345');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/transaksi$/, { timeout: 15_000 });

  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByText('Finance', { exact: true }).click();
  await page.getByRole('link', { name: 'Kategori' }).click();
  await expect(page).toHaveURL(/\/kategori$/);

  await page.getByLabel('Nama kategori').fill(namaKategori);
  await page.getByLabel('Jenis').selectOption('expense');
  await page.getByRole('button', { name: 'Tambah' }).click();

  await expect(page.getByText(namaKategori)).toBeVisible();

  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByText('Finance', { exact: true }).click();
  await page.getByRole('link', { name: 'Arus dana' }).click();
  await expect(page).toHaveURL(/\/transaksi$/);

  await page.getByLabel('Kategori').selectOption({ label: `${namaKategori} (pengeluaran)` });
  await page.getByLabel('Nominal (Rp)').fill('75000');
  await page.getByLabel('Deskripsi (opsional)').fill('Kopi sore');
  await page.getByRole('button', { name: 'Simpan transaksi' }).click();

  await expect(page.getByText('Kopi sore')).toBeVisible();
  await expect(page.getByTestId('transaction-amount').first()).toHaveText('Rp75.000');
});
