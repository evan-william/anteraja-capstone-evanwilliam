import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const output = join(projectRoot, 'docs', 'day5-ui', 'qa');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function run(name, task) {
  try {
    await task();
    results.push({ name, status: 'passed' });
  } catch (error) {
    results.push({ name, status: 'failed', detail: error instanceof Error ? error.message : String(error) });
  }
}

async function capture(page, name) {
  await page.screenshot({ path: join(output, `${name}.webp`), type: 'webp', quality: 82, fullPage: true });
}

const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
const page = await context.newPage();
page.setDefaultTimeout(12_000);
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`); });

await run('auth desktop dan kontrol carousel', async () => {
  await page.goto(`${baseURL}/masuk`, { waitUntil: 'networkidle' });
  if (await page.getByRole('tab').count() !== 3) throw new Error('Carousel tidak memiliki 3 kontrol slide.');
  await page.getByRole('button', { name: 'Jeda carousel' }).click();
  await page.getByRole('tab', { name: /slide 2/i }).click();
  await page.waitForTimeout(800);
  await capture(page, '01-auth-desktop');
});

await run('register desktop', async () => {
  await page.goto(`${baseURL}/daftar`, { waitUntil: 'networkidle' });
  await page.getByLabel('Nama').fill('E');
  await page.getByLabel('Email').fill('alamat-salah');
  await page.getByLabel('Password').fill('123');
  await page.getByRole('button', { name: 'Buat akun' }).click();
  await page.getByRole('alert').waitFor();
  await capture(page, '02-register-desktop');
});

await run('tracking valid dan tidak valid', async () => {
  await page.goto(`${baseURL}/lacak`, { waitUntil: 'networkidle' });
  await page.getByLabel('Nomor resi').fill('SALAH');
  await page.getByLabel('Kode akses').fill('12');
  await page.getByRole('button', { name: /Lacak kiriman/i }).click();
  await page.getByText('Gunakan format resi ANT-100015.').waitFor();
  await capture(page, '03-tracking-invalid');
  await page.goto(`${baseURL}/lacak/ANT-100015?code=260926`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'ANT-100015' }).waitFor();
  await capture(page, '04-tracking-valid');
});

await run('loading tracking tanpa layout shift', async () => {
  await page.route('**/api/v1/tracking/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto(`${baseURL}/lacak/ANT-100015?code=260926`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Memuat status kiriman').waitFor();
  await capture(page, '05-tracking-loading');
  await page.getByRole('heading', { name: 'ANT-100015' }).waitFor();
  await page.unroute('**/api/v1/tracking/**');
});

await run('login dan dashboard terisi', async () => {
  await page.goto(`${baseURL}/masuk`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('demo@contoh.test');
  await page.getByLabel('Password').fill('demo12345');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL(/\/transaksi$/);
  await page.goto(`${baseURL}/pengiriman`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Operasi pengiriman' }).waitFor();
  await capture(page, '06-dashboard-desktop');
});

await run('dashboard kosong karena filter', async () => {
  await page.getByPlaceholder('Cari resi, penerima, kota').fill('tidak-ada-hasil-panjang-sekali');
  await page.getByText('Tidak ada kiriman yang cocok').waitFor();
  await capture(page, '07-dashboard-empty');
});

await run('export mengikuti filter', async () => {
  await page.getByPlaceholder('Cari resi, penerima, kota').fill('ANT-100015');
  const downloadPromise = page.waitForEvent('download');
  await page.getByTitle('Ekspor CSV').click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('.csv')) throw new Error('Ekspor CSV tidak menghasilkan file CSV.');
});

await run('dashboard dengan konten panjang', async () => {
  await page.getByPlaceholder('Cari resi, penerima, kota').fill('');
  await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    if (!firstRow) return;
    const cells = firstRow.querySelectorAll('td');
    if (cells[0]) cells[0].querySelector('p')?.replaceChildren('Penerima dengan nama sangat panjang untuk pengujian layout · layanan prioritas');
    if (cells[1]) cells[1].textContent = 'Kota tujuan dengan nama operasional sangat panjang';
    if (cells[4]) cells[4].textContent = 'Fasilitas sortir dengan nama lokasi yang sangat panjang';
  });
  await capture(page, '08-dashboard-long-content');
});

await run('finance dan rekonsiliasi', async () => {
  await page.goto(`${baseURL}/transaksi`, { waitUntil: 'networkidle' });
  await capture(page, '09-finance-desktop');
  await page.goto(`${baseURL}/import`, { waitUntil: 'networkidle' });
  await capture(page, '10-reconciliation-desktop');
});

await run('mobile auth, tracking, dashboard, navigasi', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, name] of [['/masuk', '11-auth-mobile'], ['/lacak', '12-tracking-mobile'], ['/pengiriman', '13-dashboard-mobile']]) {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
    await capture(page, name);
  }
  await page.getByText('Menu', { exact: true }).click();
  await page.getByRole('link', { name: 'Rekonsiliasi' }).waitFor();
});

await run('tablet', async () => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto(`${baseURL}/pengiriman`, { waitUntil: 'networkidle' });
  await capture(page, '14-dashboard-tablet');
});

await run('keyboard dan fokus', async () => {
  await page.goto(`${baseURL}/lacak`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const visibleFocus = await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return false;
    const style = getComputedStyle(active);
    return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  });
  if (!visibleFocus) throw new Error('Focus pertama tidak terlihat.');
});

await run('kegagalan jaringan tracking', async () => {
  await page.route('**/api/v1/tracking/**', (route) => route.abort());
  await page.goto(`${baseURL}/lacak/ANT-100015?code=260926`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Kiriman belum ditemukan').waitFor();
  await page.unroute('**/api/v1/tracking/**');
});

await context.close();

const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const reducedPage = await reduced.newPage();
reducedPage.setDefaultTimeout(12_000);
await run('prefers-reduced-motion', async () => {
  await reducedPage.goto(`${baseURL}/masuk`, { waitUntil: 'networkidle' });
  const pauseButton = reducedPage.getByRole('button', { name: 'Jeda carousel' });
  await pauseButton.waitFor();
  await capture(reducedPage, '15-auth-reduced-motion');
});
await reduced.close();

await browser.close();
const actionableErrors = browserErrors.filter((item) => !item.includes('/_next/hmr') && !item.includes('ERR_FAILED'));
results.push({ name: 'console browser', status: actionableErrors.length ? 'failed' : 'passed', detail: actionableErrors.join('\n') || undefined });
await writeFile(join(output, 'results.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);

console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.status === 'failed')) process.exitCode = 1;
