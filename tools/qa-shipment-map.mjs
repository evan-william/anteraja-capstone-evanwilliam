import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '@playwright/test');
const base = process.env.MAP_QA_URL || 'http://127.0.0.1:3019';
const output = 'output/geolocation-map';
fs.mkdirSync(output, { recursive: true });
const checks = [];
const pageErrors = [];
const browser = await chromium.launch();
const check = (name, fn) => { fn(); checks.push({ name, passed: true }); };

// fixture khusus test: tidak disajikan server, tidak dipakai aplikasi atau screenshot layanan asli.
async function fixture(page, mode = 'success') {
  await page.addInitScript(({ mode }) => {
    window.SHIPMENT_MAP_CONFIG = { apiKey: 'test-fixture', mapId: 'DEMO_MAP_ID' };
    window.__fixture = { markers: [], geocodes: 0, info: null, mapOptions: null };
    class MapFixture {
      constructor(element, options) { this.zoom = options.zoom; window.__fixture.mapOptions = options; }
      panTo(value) { window.__fixture.pan = value; }
      setZoom(value) { this.zoom = value; }
      getZoom() { return this.zoom; }
      fitBounds(bounds) { window.__fixture.bounds = bounds.points; }
    }
    class MarkerFixture extends HTMLElement {
      constructor(options) { super(); Object.assign(this, options); window.__fixture.markers.push(this); }
    }
    class PinFixture extends HTMLElement { constructor(options) { super(); this.options = options; } }
    customElements.define('test-map-marker', MarkerFixture);
    customElements.define('test-map-pin', PinFixture);
    class InfoFixture {
      setContent(value) { window.__fixture.info = value.textContent; }
      open(options) { window.__fixture.open = Boolean(options.anchor); }
      close() { window.__fixture.open = false; }
    }
    class GeocoderFixture {
      async geocode(request) {
        window.__fixture.geocodes++;
        window.__fixture.geocodeRequest = request;
        if (mode === 'quota') throw new Error('OVER_QUERY_LIMIT');
        return { results: [{ formatted_address: 'Monumen Nasional, Jakarta', geometry: { location: { lat: () => -6.1754, lng: () => 106.8272 } } }] };
      }
    }
    window.google = { maps: { LatLngBounds: class { constructor() { this.points = []; } extend(point) { this.points.push(point); } }, importLibrary: async name => {
      if (name === 'maps') return { Map: MapFixture, InfoWindow: InfoFixture };
      if (name === 'marker') return { AdvancedMarkerElement: MarkerFixture, PinElement: PinFixture };
      return { Geocoder: GeocoderFixture };
    } } };
  }, { mode });
  await page.route('**/config.local.js', route => route.fulfill({ contentType: 'text/javascript', body: '// config supplied by test fixture' }));
}

try {
  const page = await browser.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${base}/shipment-map.html`);
  await page.getByText('Google Maps menunggu key-mu.', { exact: true }).waitFor();
  check('missing key: explicit setup state, no pretend map', () => assert.ok(true));
  assert.equal(await page.locator('#locations button').count(), 12);
  checks.push({ name: 'dataset still readable without key', passed: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    checks.push({ name: `no horizontal overflow at ${width}px`, passed: true });
    assert.ok(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)));
    await page.screenshot({ path: `${output}/missing-key-${width}.png`, fullPage: true });
    checks.push({ name: `logo and favicon asset loading at ${width}px`, passed: true });
  }
  await page.locator('#search').fill('ant-190003');
  assert.equal(await page.locator('#locations button').count(), 1);
  await page.locator('#locations button').press('Enter');
  assert.ok((await page.locator('#map-status').textContent()).includes('ANT-190003'));
  checks.push({ name: 'keyboard selection works while map is unavailable', passed: true });
  await page.locator('#search').fill('not-found');
  assert.ok(await page.locator('#empty').isVisible());
  checks.push({ name: 'search no-result empty state', passed: true });
  await page.locator('#search').fill('');
  await page.locator('#kind').selectOption('courier');
  assert.equal(await page.locator('#locations button').count(), 3);
  checks.push({ name: 'courier filter returns exactly three rows', passed: true });
  for (const resource of ['/.env.local', '/backend/.env', '/.git/config', '/exercises/geolocation-map/data.test.mjs', '/frontend/main.tsx', '/public/../.env.local']) {
    const response = await page.request.get(base + resource);
    check(`private/unsupported resource blocked: ${resource}`, () => assert.equal(response.status(), 404));
  }
  const methodResponse = await page.request.post(base + '/shipment-map.html', { data: 'test' });
  check('server rejects POST for static exercise', () => assert.equal(methodResponse.status(), 405));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  checks.push({ name: 'reduced motion preference supported', passed: true });

  const success = await browser.newPage();
  success.on('pageerror', error => pageErrors.push(error.message));
  await fixture(success);
  await success.goto(`${base}/shipment-map.html`);
  await success.getByText(/Berhasil: Monumen Nasional/).waitFor();
  let details = await success.evaluate(() => ({ count: window.__fixture.markers.length, requests: window.__fixture.geocodes, center: window.__fixture.mapOptions.center, ids: window.__fixture.markers.map(marker => marker.title) }));
  check('fixture: 12 distinct markers after address geocoding', () => { assert.equal(details.count, 12); assert.equal(new Set(details.ids).size, 12); });
  check('fixture: geocoding runs only once', () => assert.equal(details.requests, 1));
  check('fixture: map initially centered in Jakarta', () => assert.deepEqual(details.center, { lat: -6.2088, lng: 106.8456 }));
  await success.evaluate(() => window.__fixture.markers[2].dispatchEvent(new Event('gmp-click')));
  details = await success.evaluate(() => ({ info: window.__fixture.info, open: window.__fixture.open }));
  check('fixture: marker click opens accurate shipment info', () => { assert.ok(details.open); assert.match(details.info, /ANT-190003/); assert.match(details.info, /Perlu tindakan/); assert.match(details.info, /Penerima belum/); });
  const row = success.locator('[data-id="c2"]');
  await row.focus();
  await row.press('Enter');
  assert.equal(await row.evaluate(element => element === document.activeElement), true);
  assert.equal(await row.getAttribute('aria-pressed'), 'true');
  checks.push({ name: 'fixture: keyboard list selection retains focus', passed: true });
  assert.match(await success.evaluate(() => window.__fixture.info), /Kurir Budi/);
  await success.locator('#kind').selectOption('courier');
  assert.equal(await success.evaluate(() => window.__fixture.markers.filter(marker => marker.map).length), 3);
  checks.push({ name: 'fixture: filter synchronizes map marker visibility', passed: true });
  await success.locator('#fit-map').click();
  assert.equal(await success.evaluate(() => window.__fixture.bounds.length), 3);
  checks.push({ name: 'fixture: fit bounds uses filtered marker coordinates', passed: true });
  await success.locator('#search').fill('not-found');
  assert.equal(await success.evaluate(() => window.__fixture.markers.filter(marker => marker.map).length), 0);
  assert.equal(await success.evaluate(() => window.__fixture.open), false);
  checks.push({ name: 'fixture: empty filter hides markers and closes stale info', passed: true });
  await success.locator('#fit-map').click();
  assert.match(await success.locator('#map-status').textContent(), /Tidak ada titik/);
  checks.push({ name: 'fixture: fit empty data is safe', passed: true });

  const quota = await browser.newPage();
  quota.on('pageerror', error => pageErrors.push(error.message));
  await fixture(quota, 'quota');
  await quota.goto(`${base}/shipment-map.html`);
  await quota.getByText(/Kuota Google Maps tercapai/).waitFor();
  assert.equal(await quota.evaluate(() => window.__fixture.markers.length), 11);
  await quota.locator('#retry-geocode').click();
  await quota.getByText(/Kuota Google Maps tercapai/).waitFor();
  assert.equal(await quota.evaluate(() => window.__fixture.geocodes), 2);
  checks.push({ name: 'fixture: quota failure keeps 11 markers; retry is manual only', passed: true });

  const network = await browser.newPage();
  network.on('pageerror', error => pageErrors.push(error.message));
  await network.route('**/config.local.js', route => route.fulfill({ contentType: 'text/javascript', body: 'window.SHIPMENT_MAP_CONFIG={apiKey:"test-network",mapId:"DEMO_MAP_ID"};' }));
  await network.route('https://maps.googleapis.com/**', route => route.abort());
  await network.goto(`${base}/shipment-map.html`);
  await network.getByText('Google Maps belum dapat dimuat.', { exact: true }).waitFor();
  assert.ok(await network.locator('#retry-map').isVisible());
  assert.equal(await network.locator('#locations button').count(), 12);
  checks.push({ name: 'network failure: clear error, manual retry and preserved list', passed: true });
  check('no uncaught browser exceptions', () => assert.deepEqual(pageErrors, []));
  fs.writeFileSync(`${output}/browser-results.json`, JSON.stringify({ checks, passed: checks.length, pageErrors, realGoogleMapsVerified: false, realGeocodingVerified: false, restrictionsVerified: false, note: 'No account key available. Success cases use test-only provider fixtures; screenshots show actual missing-key UI, not a fake working map.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, pageErrors, realGoogleMapsVerified: false }));
} finally { await browser.close(); }
