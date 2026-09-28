import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const evidence = (name) => fileURLToPath(new URL(`../evidence/${name}`, import.meta.url));
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  let documentLoads = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text());
  });
  page.on('domcontentloaded', () => { documentLoads += 1; });
  await page.route('**/provinces.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: '31', name: 'Daerah Khusus Ibukota Jakarta' }] }) }));

  await page.goto(base);
  await page.evaluate(() => { window.__spaMarker = 'persistent'; });
  const header = await page.locator('.site-header').elementHandle();
  const footer = await page.locator('.site-footer').elementHandle();
  documentLoads = 0;

  // NavLink and item Link change URLs without replacing the document or layout.
  await page.getByRole('link', { name: 'Daftar kiriman' }).click();
  assert.equal(new URL(page.url()).pathname, '/shipments');
  assert.equal(await page.evaluate(() => window.__spaMarker), 'persistent');
  assert.equal(await header.evaluate((element) => element.isConnected), true);
  assert.equal(await footer.evaluate((element) => element.isConnected), true);
  assert.equal(documentLoads, 0);

  await page.locator('.shipment-row h3 a').first().click();
  assert.equal(new URL(page.url()).pathname, '/shipments/ANT-100015');
  await page.getByRole('heading', { name: 'ANT-100015' }).waitFor();
  assert.match(await page.locator('.detail-facts').innerText(), /Hub Cilandak/);
  assert.equal(documentLoads, 0);
  assert.equal(await header.evaluate((element) => element.isConnected), true);
  await page.screenshot({ path: evidence('day11-detail-desktop.png'), fullPage: true });

  await page.goBack();
  assert.equal(new URL(page.url()).pathname, '/shipments');
  assert.equal(documentLoads, 0);

  // The home form calls useNavigate after submitting a tracking search.
  await page.getByRole('link', { name: 'Beranda', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, '/');
  await page.getByRole('heading', { name: 'Tahu posisi paket. Tahu langkah berikutnya.' }).waitFor();
  await page.locator('#resi').fill('ANT-100021');
  assert.equal(await page.locator('#resi').inputValue(), 'ANT-100021');
  await page.getByRole('button', { name: 'Cari kiriman' }).click();
  await page.getByRole('heading', { name: 'Cari dan pantau kiriman.' }).waitFor();
  await page.locator('.shipment-row').first().getByText('ANT-100021').waitFor();
  assert.equal(new URL(page.url()).pathname, '/shipments');
  assert.equal(new URL(page.url()).searchParams.get('q'), 'ANT-100021');
  assert.equal(await page.locator('.shipment-row').count(), 1);
  assert.equal(documentLoads, 0);
  assert.equal(await page.evaluate(() => window.__spaMarker), 'persistent');

  // Direct URLs must load after a browser refresh; unknown ids show a safe fallback.
  await page.goto(`${base}/shipments/ANT-100015`);
  await page.getByRole('heading', { name: 'ANT-100015' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'ANT-100015' }).waitFor();
  await page.goto(`${base}/shipments/TIDAK-ADA`);
  await page.getByRole('heading', { name: 'Resi tidak ditemukan.' }).waitFor();
  await page.goto(`${base}/halaman-yang-tidak-ada`);
  await page.getByRole('heading', { name: 'Halaman tidak ditemukan.' }).waitFor();
  await page.screenshot({ path: evidence('day11-404.png'), fullPage: true });

  // Real Chromium viewports matching DevTools desktop/tablet/mobile sizes.
  for (const [width, height, label] of [[375, 812, 'mobile'], [768, 1024, 'tablet'], [1440, 900, 'desktop']]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/shipments/ANT-100015`);
    await page.locator('.detail-sheet').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} horizontal overflow`);
    await page.screenshot({ path: evidence(`day11-detail-${label}.png`), fullPage: true });
    for (const path of ['/', '/shipments', '/ongkir', '/invalid']) {
      await page.goto(`${base}${path}`);
      await page.locator('.site-footer').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflow at ${path}`);
      if (label === 'mobile' && path === '/invalid') await page.screenshot({ path: evidence('day11-404-mobile.png'), fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: Link, NavLink, useNavigate, persistent layout, direct dynamic URL, 404, 375/768/1440 responsive viewports, no browser warnings/errors');
} finally {
  await browser.close();
}
