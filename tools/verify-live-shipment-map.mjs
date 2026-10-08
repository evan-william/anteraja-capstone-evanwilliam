import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '@playwright/test');
const base = process.env.MAP_QA_URL || 'http://127.0.0.1:3019';
const output = 'output/geolocation-map';
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(`${output}/live-results.json`, JSON.stringify({ realGoogleMapsVerified: false, realGeocodingVerified: false, note: 'Verification not yet complete.' }, null, 2));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', () => errors.push('Browser exception; inspect console locally.'));
// jangan simpan request URL atau isi key pada laporan.
try {
  await page.goto(`${base}/shipment-map.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#map-message').waitFor({ state: 'hidden', timeout: 45000 });
  await page.locator('#geocode-status').filter({ hasText: 'Berhasil:' }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('#mapped-count').textContent(), '12');
  assert.ok(await page.locator('#map .gm-style').count());
  assert.equal(await page.locator('#map gmp-advanced-marker').count(), 12);
  // klik marker nyata, bukan list; title resi membedakan marker.
  const shipmentMarker = page.locator('#map gmp-advanced-marker[title^="ANT-190003"]');
  await shipmentMarker.click();
  await page.locator('.info-window').filter({ hasText: 'ANT-190003' }).waitFor();
  assert.match(await page.locator('.info-window').textContent(), /Perlu tindakan/);
  await page.screenshot({ path: `${output}/live-marker-desktop.png`, fullPage: true });
  await page.locator('#locations [data-id="c2"]').click();
  await page.locator('.info-window').filter({ hasText: 'Kurir Budi' }).waitFor();
  assert.deepEqual(errors, []);
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${output}/live-map-${width}.png`, fullPage: true });
  }
  fs.writeFileSync(`${output}/live-results.json`, JSON.stringify({ realGoogleMapsVerified: true, realGeocodingVerified: true, markerCount: 12, shipmentInfoVerified: true, courierInfoVerified: true, widths: [375, 768, 1440], restrictionsVerified: false, note: 'Restriction settings still require redacted Google Cloud Console screenshot and human verification.' }, null, 2));
  console.log('Google Maps live + 12 markers + shipment/courier info + geocoding + responsive: PASS. Restriction proof still required.');
} catch {
  // jangan tampilkan dump html/request yang mungkin berisi key.
  console.error('Live verification NOT passed. Inspect browser locally: key, Google Cloud restrictions, map/markers, geocoding. No successful live report was written.');
  process.exitCode = 1;
} finally { await browser.close(); }
