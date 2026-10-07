import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Read-only regression checks; local demo credentials never enter the report.
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const output = 'output/organization-qa';
fs.mkdirSync(`${output}/screens`, { recursive: true });
const lines = fs.readFileSync('roles_password.txt', 'utf8').split(/\r?\n/);
const browser = await chromium.launch();
const results = [];
const errors = [];
async function layout(page, route, label) {
  await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('main h1').first().waitFor({ timeout: 30000 });
  await page.getByText('Memuat data…', { exact: true }).waitFor({ state: 'hidden', timeout: 30000 });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${label} overflows at ${width}px`);
    assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), '/brand/anteraja-favicon.png');
    assert.equal(await page.evaluate(() => [...document.images].every(image => !image.complete || image.naturalWidth > 0)), true, `${label} has a broken loaded image`);
    await page.screenshot({ path: `${output}/screens/${label}-${width}.png`, fullPage: false });
    results.push({ check: 'layout, loaded images and favicon', route, width, passed: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}
try {
  const guest = await browser.newContext();
  const publicPage = await guest.newPage();
  publicPage.on('pageerror', error => errors.push(error.message));
  await layout(publicPage, '/masuk', 'login');
  await layout(publicPage, '/daftar', 'register');
  await layout(publicPage, '/lacak/ANT-100015?code=260926', 'tracking');
  await publicPage.getByRole('heading', { name: 'Timeline pengiriman' }).waitFor();
  await publicPage.locator('summary').filter({ hasText: 'Lihat peta perjalanan' }).click();
  await publicPage.locator('.leaflet-container').waitFor({ timeout: 30000 });
  results.push({ check: 'map mounts when accordion opens', passed: true });
  await publicPage.screenshot({ path: `${output}/screens/tracking-map.png`, fullPage: true });
  await publicPage.emulateMedia({ reducedMotion: 'reduce' });
  await publicPage.goto(base + '/masuk', { waitUntil: 'domcontentloaded' });
  const tabs = publicPage.getByRole('tab');
  await tabs.nth(2).click();
  await publicPage.getByLabel('Email', { exact: true }).focus();
  await publicPage.waitForTimeout(4500);
  assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true');
  results.push({ check: 'carousel manual control and reduced-motion auto pause', passed: true });
  await guest.close();

  for (const [label, role, routes] of [
    ['Admin', 'admin', ['/admin', '/admin/kiriman', '/admin/tiket']],
    ['Seller', 'seller', ['/seller', '/pengiriman', '/transaksi', '/import', '/kategori']],
    ['Konsumen', 'consumer', ['/akun']],
  ]) {
    const credential = lines.find(line => line.startsWith(label))?.match(/:\s*(\S+@\S+)\s*\/\s*(\S+)/);
    assert.ok(credential, `${role} private demo credential missing`);
    const context = await browser.newContext();
    const login = await context.request.post(base + '/api/v1/auth/login', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, data: { email: credential[1], password: credential[2] },
    });
    assert.equal(login.status(), 200, `${role} Supabase login failed`);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) await layout(page, route, `${role}-${route.split('/').at(-1)}`);
    if (role !== 'consumer') {
      const nav = page.getByRole('navigation', { name: 'Navigasi utama', exact: true });
      const trigger = nav.getByRole('button').first();
      await trigger.focus();
      const link = nav.getByRole('link', { name: 'Ringkasan', exact: true });
      await link.focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(`**${role === 'admin' ? '/admin' : '/seller'}`);
      results.push({ check: `${role} grouped navigation works with keyboard`, passed: true });
    }
    if (role === 'seller') {
      await page.goto(base + '/pengiriman', { waitUntil: 'domcontentloaded' });
      await page.locator('#shipment-search').waitFor();
      const firstAwb = await page.locator('#shipments-table tbody a').first().textContent();
      await page.locator('#shipment-search').fill(firstAwb.trim());
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#shipments-table tbody tr').count(), 1);
      const downloaded = page.waitForEvent('download');
      await page.locator('#export-shipments-json').click();
      const download = await downloaded;
      const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
      assert.equal(exported.length, 1);
      assert.equal(exported[0].tracking_number, firstAwb.trim());
      const csvDownload = page.waitForEvent('download');
      await page.locator('#export-shipments-csv').click();
      const csv = fs.readFileSync(await (await csvDownload).path(), 'utf8');
      assert.equal(csv.split('\n').length, 2);
      assert.ok(csv.includes(firstAwb.trim()));
      await page.locator('#shipment-search').fill('NO-SUCH-TRACKING-NUMBER');
      await page.getByText('Tidak ada kiriman yang cocok', { exact: true }).waitFor();
      results.push({ check: 'seller search, JSON/CSV export follow current filter, empty state', passed: true });
    }
    await context.request.post(base + '/api/v1/auth/logout', { headers: { 'X-Requested-With': 'XMLHttpRequest' }, data: {} });
    await context.close();
    console.log(`PASS ${role}: responsive routes and read-only workflow checks`);
  }
  assert.deepEqual(errors, [], 'Browser runtime errors detected');
  console.log(`PASS ${results.length} checks; no browser runtime errors`);
} finally {
  fs.writeFileSync(path.join(output, 'responsive-workflows.json'), JSON.stringify({ base, results, errors }, null, 2));
  await browser.close();
}
