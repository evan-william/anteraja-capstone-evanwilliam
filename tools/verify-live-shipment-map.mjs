import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '@playwright/test');
const base = process.env.MAP_QA_URL || 'http://127.0.0.1:3019';
const output = 'output/geolocation-map';
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(`${output}/live-results.json`, JSON.stringify({ realGoogleMapsVerified: false, realGeocodingVerified: false, note: 'Verification not yet complete.' }, null, 2));
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
let phase = 'map and geocoding';
page.on('pageerror', () => errors.push('Browser exception; inspect console locally.'));
// jangan simpan request URL atau isi key pada laporan.
try {
  await page.goto(`${base}/shipment-map.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#map-message').waitFor({ state: 'hidden', timeout: 45000 });
  await page.locator('#geocode-status').filter({ hasText: 'Berhasil:' }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('#mapped-count').textContent(), '12');
  assert.ok(await page.locator('#map .gm-style').count());
  assert.equal(await page.locator('#map gmp-advanced-marker').count(), 12);
  phase = 'Google attribution';
  await page.locator('#map a[href*="google.com"]').first().waitFor({ state: 'visible' });
  // klik marker nyata, bukan list; title resi membedakan marker.
  const shipmentMarker = page.locator('#map gmp-advanced-marker[title^="ANT-190003"]');
  phase = 'shipment marker click';
  await shipmentMarker.click();
  await page.locator('.info-window').filter({ hasText: 'ANT-190003' }).waitFor();
  assert.match(await page.locator('.info-window').textContent(), /Perlu tindakan/);
  // beri renderer tile satu frame stabil sebelum screenshot bukti layanan asli.
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${output}/live-marker-desktop.png`, fullPage: true });
  await page.locator('#locations [data-id="c2"]').click();
  phase = 'courier detail';
  await page.locator('.info-window').filter({ hasText: 'Kurir Budi' }).waitFor();
  await page.locator('#search').fill('ANT-190003');
  phase = 'shipment filter';
  assert.equal(await page.locator('#locations button').count(), 1);
  await page.waitForFunction(() => document.querySelectorAll('#map gmp-advanced-marker').length === 1);
  assert.equal(await page.locator('#map gmp-advanced-marker').count(), 1);
  await page.locator('#search').fill('');
  await page.locator('#kind').selectOption('courier');
  phase = 'courier filter';
  assert.equal(await page.locator('#locations button').count(), 3);
  // google bisa mengeluarkan marker di luar viewport dari DOM; fit dulu agar terhitung.
  await page.locator('#fit-map').click();
  await page.waitForFunction(() => document.querySelectorAll('#map gmp-advanced-marker').length === 3);
  assert.equal(await page.locator('#map gmp-advanced-marker').count(), 3);
  await page.locator('#kind').selectOption('all');
  await page.locator('#fit-map').click();
  assert.deepEqual(errors, []);
  for (const width of [375, 768]) {
    phase = `responsive ${width}`;
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${output}/live-map-${width}.png`, fullPage: true });
  }
  fs.writeFileSync(`${output}/live-results.json`, JSON.stringify({ realGoogleMapsVerified: true, realGeocodingVerified: true, geocodingMode: 'v4', markerCount: 12, shipmentInfoVerified: true, courierInfoVerified: true, realFiltersVerified: true, googleAttributionVisible: true, uncaughtExceptions: errors.length, widths: [375, 768, 1440], restrictionsVerified: false, note: 'Restriction settings still require redacted Google Cloud Console screenshot and human verification.' }, null, 2));
  console.log('Google Maps live + 12 markers + shipment/courier info + geocoding + responsive: PASS. Restriction proof still required.');
} catch {
  // jangan tampilkan dump html/request yang mungkin berisi key.
  console.error(`Live verification NOT passed at ${phase}. Inspect browser locally; no credential or request URL is logged.`);
  console.error(JSON.stringify(await page.evaluate(() => ({ search: document.querySelector('#search')?.value, kind: document.querySelector('#kind')?.value, rows: document.querySelectorAll('#locations button').length, markers: document.querySelectorAll('#map gmp-advanced-marker').length }))));
  process.exitCode = 1;
} finally { await browser.close(); }
