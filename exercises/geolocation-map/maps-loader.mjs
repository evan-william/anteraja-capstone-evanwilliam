// satu loader per halaman; key hanya dibaca dari file lokal, tidak dicetak ke log.
export function loadGoogleMaps(config, { windowRef = window, documentRef = document, timeoutMs = 30000, onAuthFailure = () => {} } = {}) {
  if (!config?.apiKey?.trim() || config.apiKey.includes('YOUR_')) {
    return Promise.reject(new Error('MISSING_KEY'));
  }
  if (windowRef.google?.maps?.importLibrary) return Promise.resolve(windowRef.google.maps);
  return new Promise((resolve, reject) => {
    const script = documentRef.createElement('script');
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      windowRef.clearTimeout(timer);
      delete windowRef.initShipmentMap;
      if (error) { script.remove(); reject(error); }
      else resolve(windowRef.google.maps);
    };
    const timer = windowRef.setTimeout(() => finish(new Error('LOAD_TIMEOUT')), timeoutMs);
    windowRef.initShipmentMap = () => finish(windowRef.google?.maps?.importLibrary ? null : new Error('INVALID_RESPONSE'));
    // google dapat menolak key setelah callback; handler harus tetap aktif.
    windowRef.gm_authFailure = () => {
      onAuthFailure();
      finish(new Error('AUTH_FAILURE'));
    };
    script.async = true;
    script.id = 'google-maps-script';
    const params = new URLSearchParams({ key: config.apiKey.trim(), loading: 'async', callback: 'initShipmentMap', v: 'weekly', language: 'id', region: 'ID' });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.onerror = () => finish(new Error('NETWORK_ERROR'));
    documentRef.head.append(script);
  });
}

export async function geocodeAddress(geocoder, address, timeoutMs = 15000) {
  if (typeof address !== 'string' || !address.trim()) throw new Error('EMPTY_ADDRESS');
  let timer;
  try {
    const response = await Promise.race([
      geocoder.geocode({ address: address.trim(), region: 'id', componentRestrictions: { country: 'ID' } }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('GEOCODE_TIMEOUT')), timeoutMs); }),
    ]);
    const result = response?.results?.[0];
    if (!result?.geometry?.location) throw new Error('ZERO_RESULTS');
    const lat = result.geometry.location.lat();
    const lng = result.geometry.location.lng();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('INVALID_COORDINATES');
    return { lat, lng, formattedAddress: result.formatted_address || address };
  } finally { clearTimeout(timer); }
}

// demo key memakai geocoding v4; jangan kirim key ke log atau laporan pengujian.
export async function geocodeAddressV4(apiKey, address, { fetchRef = fetch, timeoutMs = 15000 } = {}) {
  if (typeof address !== 'string' || !address.trim()) throw new Error('EMPTY_ADDRESS');
  if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.includes('YOUR_')) throw new Error('MISSING_KEY');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = new URL(`https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(address.trim())}`);
  url.searchParams.set('regionCode', 'ID');
  url.searchParams.set('languageCode', 'id');
  try {
    const response = await fetchRef(url, {
      signal: controller.signal,
      headers: { 'X-Goog-Api-Key': apiKey.trim(), 'X-Goog-FieldMask': 'results.location,results.formattedAddress' },
    });
    // body error google tidak ditampilkan karena bisa berisi detail credential/project.
    if (!response.ok) {
      if (response.status === 429) throw new Error('OVER_QUERY_LIMIT');
      if ([401, 403].includes(response.status)) throw new Error('REQUEST_DENIED');
      if (response.status >= 500) throw new Error('SERVICE_UNAVAILABLE');
      throw new Error('INVALID_RESPONSE');
    }
    let data;
    try { data = await response.json(); }
    catch { throw new Error(controller.signal.aborted ? 'GEOCODE_TIMEOUT' : 'INVALID_RESPONSE'); }
    const result = data?.results?.[0];
    if (!result) throw new Error('ZERO_RESULTS');
    const lat = result.location?.latitude;
    const lng = result.location?.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('INVALID_COORDINATES');
    return { lat, lng, formattedAddress: typeof result.formattedAddress === 'string' ? result.formattedAddress : address.trim() };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('GEOCODE_TIMEOUT');
    const safeCodes = ['OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'SERVICE_UNAVAILABLE', 'INVALID_RESPONSE', 'ZERO_RESULTS', 'INVALID_COORDINATES'];
    throw new Error(safeCodes.includes(error.message) ? error.message : 'NETWORK_ERROR');
  } finally { clearTimeout(timer); }
}

export function readableError(error) {
  const code = String(error?.code || error?.message || error || 'UNKNOWN');
  if (code.includes('MISSING_KEY')) return 'Isi apiKey di exercises/geolocation-map/config.local.js dengan key Google Maps milikmu.';
  if (/AUTH|REQUEST_DENIED|ApiNotActivated|Billing|Referer/i.test(code)) return 'Google menolak akses. Periksa API aktif, izin geocoding, HTTP referrer, dan billing/key demo pada Google Cloud.';
  if (/QUOTA|OVER_QUERY_LIMIT|RESOURCE_EXHAUSTED/i.test(code)) return 'Kuota Google Maps tercapai. Tunggu kuota pulih; jangan mengulang request terus-menerus.';
  if (/ZERO_RESULTS/.test(code)) return 'Google tidak menemukan alamat. Periksa nama tempat dan kota, lalu coba lagi.';
  if (/TIMEOUT|NETWORK|UNKNOWN_ERROR|SERVICE_UNAVAILABLE/i.test(code)) return 'Koneksi peta terlalu lama atau terputus. Periksa internet, lalu coba kembali.';
  return 'Peta atau geocoding belum dapat dimuat. Periksa konfigurasi dan pesan Google di console browser.';
}
