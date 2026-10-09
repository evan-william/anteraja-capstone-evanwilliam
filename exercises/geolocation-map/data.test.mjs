import test from 'node:test';
import assert from 'node:assert/strict';
import { locations, STATUS, hasCoordinates, filterLocations, labelOf } from './data.mjs';
import { loadGoogleMaps, geocodeAddress, geocodeAddressV4, readableError } from './maps-loader.mjs';

test('dataset: 9 kiriman, 3 kurir, 11 koordinat dan 1 alamat-only', () => {
  assert.equal(locations.length, 12);
  assert.equal(locations.filter(item => item.kind === 'shipment').length, 9);
  assert.equal(locations.filter(item => item.kind === 'courier').length, 3);
  assert.equal(locations.filter(hasCoordinates).length, 11);
  assert.equal(locations.filter(item => item.address && !hasCoordinates(item)).length, 1);
  assert.equal(new Set(locations.map(item => item.id)).size, 12);
  assert.equal(new Set(locations.filter(item => item.trackingNumber).map(item => item.trackingNumber)).size, 9);
  for (const item of locations) { assert.ok(STATUS[item.status]); assert.ok(labelOf(item)); assert.ok(Object.isFrozen(item)); }
});

test('validasi koordinat termasuk nol, batas, null, NaN, infinity dan string', () => {
  for (const item of [{ lat: 0, lng: 0 }, { lat: -90, lng: 180 }]) assert.equal(hasCoordinates(item), true);
  for (const item of [{}, { lat: null, lng: null }, { lat: 91, lng: 0 }, { lat: 0, lng: -181 }, { lat: NaN, lng: 1 }, { lat: Infinity, lng: 1 }, { lat: '-6', lng: 106 }]) assert.equal(hasCoordinates(item), false);
});

test('filter resi, kota, kurir, status; case insensitive; empty state tanpa mutasi', () => {
  assert.equal(filterLocations(locations, ' ant-190003 ').length, 1);
  assert.equal(filterLocations(locations, '', 'courier').length, 3);
  assert.equal(filterLocations(locations, 'JAKARTA TIMUR').length, 1);
  assert.equal(filterLocations(locations, 'PERLU TINDAKAN').length, 1);
  assert.equal(filterLocations(locations, 'budi', 'courier').length, 1);
  assert.equal(filterLocations(locations, 'does-not-exist').length, 0);
  assert.equal(filterLocations([], '').length, 0);
  assert.equal(locations.length, 12);
});

function loaderEnvironment(mode) {
  let script, removed = false;
  const windowRef = { setTimeout, clearTimeout };
  const documentRef = { createElement: () => (script = { remove: () => { removed = true; } }), head: { append: () => {
    if (mode === 'success') { windowRef.google = { maps: { importLibrary: () => {} } }; queueMicrotask(() => windowRef.initShipmentMap()); }
    if (mode === 'network') queueMicrotask(() => script.onerror());
    if (mode === 'auth') queueMicrotask(() => windowRef.gm_authFailure());
  } } };
  return { windowRef, documentRef, timeoutMs: 10, removed: () => removed, script: () => script };
}

test('key kosong / placeholder ditolak sebelum request', async () => {
  for (const key of ['', '  ', 'YOUR_API_KEY']) await assert.rejects(loadGoogleMaps({ apiKey: key }, loaderEnvironment()), /MISSING_KEY/);
});

test('loader sukses, async dan key di-encode tanpa logging', async () => {
  const env = loaderEnvironment('success');
  const result = await loadGoogleMaps({ apiKey: 'test&only' }, env);
  assert.equal(result, env.windowRef.google.maps);
  const url = new URL(env.script().src);
  assert.equal(url.searchParams.get('key'), 'test&only');
  assert.equal(url.searchParams.get('loading'), 'async');
  assert.equal(env.windowRef.initShipmentMap, undefined);
});

test('network gagal, timeout dan auth gagal ditangani serta timer dibersihkan', async () => {
  for (const [mode, code] of [['network', /NETWORK_ERROR/], ['timeout', /LOAD_TIMEOUT/], ['auth', /AUTH_FAILURE/]]) {
    const env = loaderEnvironment(mode);
    await assert.rejects(loadGoogleMaps({ apiKey: 'test' }, env), code);
    assert.ok(env.removed());
  }
});

test('auth failure sesudah callback tetap memberi feedback', async () => {
  const env = loaderEnvironment('success');
  let failed = 0;
  await loadGoogleMaps({ apiKey: 'test' }, { ...env, onAuthFailure: () => failed++ });
  env.windowRef.gm_authFailure();
  assert.equal(failed, 1);
});

test('geocoding membaca hasil provider; tidak mengubah alamat menjadi koordinat palsu', async () => {
  let request;
  const geocoder = { geocode: async value => { request = value; return { results: [{ formatted_address: 'Alamat hasil provider', geometry: { location: { lat: () => -6.1754, lng: () => 106.8272 } } }] }; } };
  assert.deepEqual(await geocodeAddress(geocoder, ' Monas '), { lat: -6.1754, lng: 106.8272, formattedAddress: 'Alamat hasil provider' });
  assert.equal(request.address, 'Monas');
  assert.deepEqual(request.componentRestrictions, { country: 'ID' });
});

test('geocoding empty, zero results, invalid coordinates, quota dan timeout', async () => {
  await assert.rejects(geocodeAddress({}, ''), /EMPTY_ADDRESS/);
  await assert.rejects(geocodeAddress({ geocode: async () => ({ results: [] }) }, 'Monas'), /ZERO_RESULTS/);
  await assert.rejects(geocodeAddress({ geocode: async () => ({ results: [{ geometry: { location: { lat: () => 200, lng: () => 0 } } }] }) }, 'Monas'), /INVALID_COORDINATES/);
  await assert.rejects(geocodeAddress({ geocode: async () => { throw new Error('OVER_QUERY_LIMIT'); } }, 'Monas'), /OVER_QUERY_LIMIT/);
  await assert.rejects(geocodeAddress({ geocode: () => new Promise(() => {}) }, 'Monas', 5), /GEOCODE_TIMEOUT/);
});

test('pesan error aman dan jelas tanpa menampilkan key / stack trace', () => {
  assert.match(readableError(new Error('MISSING_KEY')), /config.local/);
  assert.match(readableError(new Error('REQUEST_DENIED')), /Google menolak/);
  assert.match(readableError(new Error('OVER_QUERY_LIMIT')), /Kuota/);
  assert.match(readableError(new Error('ZERO_RESULTS')), /tidak menemukan/);
  assert.match(readableError(new Error('NETWORK_ERROR')), /Koneksi/);
  assert.doesNotMatch(readableError(new Error('private-token')), /private-token/);
});

const v4Response = (result = { location: { latitude: -6.1754, longitude: 106.8272 }, formattedAddress: 'Monas, Jakarta' }) => ({ ok: true, json: async () => ({ results: [result] }) });

test('v4: alamat di-encode, key di header, response field dibatasi', async () => {
  let request;
  const result = await geocodeAddressV4('test-key', ' Monas / Jakarta ', { fetchRef: async (url, options) => { request = { url, options }; return v4Response(); } });
  assert.deepEqual(result, { lat: -6.1754, lng: 106.8272, formattedAddress: 'Monas, Jakarta' });
  assert.equal(decodeURIComponent(request.url.pathname), '/v4/geocode/address/Monas / Jakarta');
  assert.equal(request.url.searchParams.get('regionCode'), 'ID');
  assert.equal(request.url.searchParams.has('key'), false);
  assert.equal(request.options.headers['X-Goog-Api-Key'], 'test-key');
  assert.equal(request.options.headers['X-Goog-FieldMask'], 'results.location,results.formattedAddress');
});

test('v4: input kosong/placeholder ditolak sebelum request', async () => {
  let calls = 0;
  const options = { fetchRef: async () => { calls++; } };
  await assert.rejects(geocodeAddressV4('test', '', options), /EMPTY_ADDRESS/);
  for (const key of ['', null, 'YOUR_DEMO_KEY']) await assert.rejects(geocodeAddressV4(key, 'Monas', options), /MISSING_KEY/);
  assert.equal(calls, 0);
});

test('v4: status izin, kuota dan server dipetakan tanpa body provider', async () => {
  for (const [status, code] of [[401, 'REQUEST_DENIED'], [403, 'REQUEST_DENIED'], [429, 'OVER_QUERY_LIMIT'], [503, 'SERVICE_UNAVAILABLE'], [400, 'INVALID_RESPONSE']]) {
    await assert.rejects(geocodeAddressV4('test', 'Monas', { fetchRef: async () => ({ ok: false, status, json: () => { throw new Error('body must not be read'); } }) }), new RegExp(code));
  }
});

test('v4: tidak ada hasil, JSON rusak, koordinat tidak valid', async () => {
  await assert.rejects(geocodeAddressV4('test', 'Monas', { fetchRef: async () => ({ ok: true, json: async () => ({ results: [] }) }) }), /ZERO_RESULTS/);
  await assert.rejects(geocodeAddressV4('test', 'Monas', { fetchRef: async () => ({ ok: true, json: async () => { throw new SyntaxError('bad JSON'); } }) }), /INVALID_RESPONSE/);
  for (const location of [{ latitude: 200, longitude: 0 }, { latitude: '-6', longitude: 106 }, {}]) {
    await assert.rejects(geocodeAddressV4('test', 'Monas', { fetchRef: async () => v4Response({ location }) }), /INVALID_COORDINATES/);
  }
});

test('v4: timeout membatalkan request dan jaringan gagal tidak membocorkan key', async () => {
  let signal;
  await assert.rejects(geocodeAddressV4('test', 'Monas', { timeoutMs: 5, fetchRef: async (_, options) => {
    signal = options.signal;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('abort')), { once: true }));
  } }), /GEOCODE_TIMEOUT/);
  assert.equal(signal.aborted, true);
  await assert.rejects(geocodeAddressV4('private-key', 'Monas', { fetchRef: async () => { throw new Error('private-key'); } }), /NETWORK_ERROR/);
});
