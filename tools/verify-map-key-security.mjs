import fs from 'node:fs';

// uji izin referrer memakai key lokal; tidak simpan key, url request, atau body google.
const config = fs.readFileSync('exercises/geolocation-map/config.local.js', 'utf8');
const key = config.match(/apiKey\s*:\s*["']([^"']+)["']/)?.[1];
if (!key) throw new Error('Isi key lokal sebelum pengujian restriction.');
const results = [];
for (const referrer of ['http://127.0.0.1:3019/shipment-map.html', 'https://example.invalid/']) {
  try {
    const response = await fetch('https://geocode.googleapis.com/v4/geocode/address/Monumen%20Nasional%2C%20Jakarta?fields=results.location', {
      signal: AbortSignal.timeout(15000),
      headers: { 'X-Goog-Api-Key': key, Referer: referrer },
    });
    results.push({ referrer, status: response.status, accepted: response.ok });
    await response.body?.cancel();
  } catch { results.push({ referrer, networkError: true }); }
}
const restrictionBehaviorVerified = results[0].accepted === true && [401, 403].includes(results[1].status);
const output = { results, restrictionBehaviorVerified, accountSettingsVerified: false, note: 'Respons API menguji perilaku; screenshot setting Google Cloud tetap diperlukan untuk membuktikan konfigurasi akun.' };
fs.mkdirSync('output/geolocation-map', { recursive: true });
fs.writeFileSync('output/geolocation-map/key-security-results.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output));
