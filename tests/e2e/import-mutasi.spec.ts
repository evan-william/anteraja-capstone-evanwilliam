import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const bankA = path.resolve(__dirname, '../../docs/data/mutasi-bank-a.csv');
const bankB = path.resolve(__dirname, '../../docs/data/mutasi-bank-b.csv');

async function signIn(page: Page) {
  await page.goto('/masuk');
  await page.getByLabel('Email').fill('demo@contoh.test');
  await page.getByLabel('Password').fill('demo12345');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/transaksi$/, { timeout: 15_000 });
}

async function assignAllNewRows(page: Page) {
  const newRows = page.locator('tbody tr').filter({ hasText: 'Baru' });
  for (let index = 0; index < (await newRows.count()); index += 1) {
    const row = newRows.nth(index);
    const text = await row.textContent();
    const income = /Salary|Transfer from Checking|Refund Shopee|GAJI|REFUND|BUNGA/.test(
      text ?? '',
    );
    await row.getByRole('combobox').selectOption({ label: income ? 'Settlement COD' : 'Biaya pengiriman' });
  }
}

async function cancelLatestImport(page: Page, fileName: string) {
  const fileLabel = page.getByText(fileName, { exact: true }).first();
  const historyItem = fileLabel.locator('..').locator('..');
  page.once('dialog', (dialog) => dialog.accept());
  await historyItem.getByRole('button', { name: 'Batalkan' }).click();
  await expect(page.getByText(/transaksi hasil impor dibatalkan/)).toBeVisible();
  await expect(historyItem.getByText('Dibatalkan')).toBeVisible();
}

test('Bank A, Bank B, rekonsiliasi manual, dan pembatalan import', async ({ page }) => {
  await signIn(page);

  // Satu dari dua mutasi Grab Food identik harus Cocok; kandidat tidak boleh dipakai dua kali.
  await page.getByLabel('Kategori').selectOption({ label: 'Biaya pengiriman (pengeluaran)' });
  await page.getByLabel('Nominal (Rp)').fill('54000');
  await page.getByLabel('Tanggal').fill('2026-08-02');
  await page.getByLabel('Deskripsi (opsional)').fill('Grab Food');
  await page.getByRole('button', { name: 'Simpan transaksi' }).click();
  await expect(page.getByText('Grab Food').first()).toBeVisible();

  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByText('Finance', { exact: true }).click();
  await page.getByRole('link', { name: 'Rekonsiliasi' }).click();
  await page.getByLabel('File mutasi bank').setInputFiles(bankB);
  await expect(page.getByText('Bank B', { exact: false })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(11);
  const matchedRows = await page.locator('tbody tr').filter({ hasText: 'Cocok' }).count();
  expect(matchedRows).toBeGreaterThan(0);
  expect(matchedRows).toBeLessThanOrEqual(2);
  await assignAllNewRows(page);
  await page.getByRole('button', { name: 'Simpan rekonsiliasi' }).click();
  await expect(page.getByText('Impor berhasil. Transaksi baru sudah ditambahkan.')).toBeVisible();
  await cancelLatestImport(page, 'mutasi-bank-b.csv');

  await page.getByLabel('File mutasi bank').setInputFiles(bankA);
  await expect(page.getByText('Bank A', { exact: false })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await expect(page.locator('tbody tr').filter({ hasText: 'Error' })).toHaveCount(4);
  await assignAllNewRows(page);
  await page.getByRole('button', { name: 'Simpan rekonsiliasi' }).click();
  await expect(page.getByText('Impor berhasil. Transaksi baru sudah ditambahkan.')).toBeVisible();
  await cancelLatestImport(page, 'mutasi-bank-a.csv');
});
