# Day 19 - Implementasi dan status verifikasi

Tanggal: 8 Oktober 2026. Branch: `feature/geolocation-map`.
Baseline: `8-react-and-laravel`, commit `460ebbe`.

## Pemetaan terhadap soal

| Instruksi | Implementasi / bukti | Status aktual |
|---|---|---|
| shipment-map.html | Root repository; HTML semantic, CSS, ES modules | Dibuat |
| Google Maps JavaScript API | maps-loader.mjs; async loading, weekly, bahasa Indonesia | Kode dibuat; layanan asli menunggu key |
| Key aman dan restriction domain | config.local.js ignored; panduan HTTP referrer + API restriction | Tidak ada key di Git; restriction akun BELUM diverifikasi |
| Center Jakarta | app.mjs start(), -6.2088 / 106.8456, zoom 12 | Lulus fixture; Google live belum diuji |
| Array shipment/courier | data.mjs: 9 kiriman, 3 kurir, 11 koordinat, 1 alamat-only | Lulus unit test |
| Satu marker per item | for...of addMarker; dedup id; AdvancedMarkerElement | 12 marker lulus fixture; Google live belum diuji |
| InfoWindow resi/status | infoContent + gmp-click; textContent untuk data | Klik resi/kurir dan keyboard lulus fixture |
| Bonus geocoding | Google Geocoder, ANT-190009 alamat Monumen Nasional | Success/quota/timeout lulus test-double; geocoding live belum diuji |
| Minimal 3 commit | Setup; marker/interaksi; tests/dokumentasi | Riwayat Git tersedia di laporan pengumpulan |
| Pull Request + review + merge | PR ke baseline terbaru, menunggu review sungguhan | Status GitHub dicatat di berkas pengumpulan; tidak mengarang review |

## QA yang benar-benar dijalankan

- `node --test exercises/geolocation-map/data.test.mjs`: **10 test lulus**.
- `node --check` app.mjs, maps-loader.mjs, data.mjs, server dan QA script: syntax check.
- Chromium: **31 check lulus**, **0 uncaught page exception**.
- Ukuran 375, 768, 1440px: tidak ada horizontal overflow, logo ter-load.
- Halaman tanpa key: pesan konfigurasi jelas; 12 data tetap dapat dibaca, pencarian,
  filter kurir, no-result empty state, dan keyboard selection bekerja.
- Marker/info/geocoder success, dedup, fitBounds terfilter, stale InfoWindow dan quota retry:
  **provider fixture khusus test**, bukan hasil Google Maps asli.
- Network API diblokir dalam test: pesan error dan retry manual, data tidak hilang.
- `.env.local`, backend/.env, .git/config, test file, frontend source tidak dapat dibuka
  melalui server latihan. POST ditolak 405; unknown/private path ditolak 404.
- Preferensi reduced-motion didukung, tanpa animasi atau retry request berulang.
- Screenshot aktual desktop/mobile ditinjau: header, form, daftar, legenda dan fallback
  tidak overlap. Gambar laporan menunjukkan kondisi **menunggu key**, bukan peta sukses.
- `git diff --check`: tidak ada whitespace error.

Output browser detail: `output/geolocation-map/browser-results.json` (lokal, ignored).
Paket submit menyertakan salinan report JSON dan screenshots tanpa key.

## Yang belum bisa dinyatakan lulus

Pemilik belum memiliki Google Maps API key. Tidak ada peta Google asli, marker Google
asli, atau hasil geocoding Google asli yang sudah diverifikasi pada akun ini.
Website/API restriction dan kuota pada Google Cloud belum dapat dibuktikan dari kode.
Karena itu tugas **belum layak diklaim lengkap/100** hanya dengan test-double dan PDF.

Setelah key tersedia: verifikasi render map/tile, seluruh marker, klik resi dan kurir,
geocoding success, screenshot console restriction (key disamarkan), lalu jalankan
`tools/verify-live-shipment-map.mjs` dan buat ulang PDF menggunakan builder Day 19.
Terakhir minta reviewer nyata lalu merge sesudah disetujui. Tanpa reviewer, jangan
membuat review palsu atau mengklaim sudah merged.

## Batas cakupan

Tidak ada perubahan schema PostgreSQL, Supabase Auth, RLS, data pelanggan, route Laravel,
PRD/FRD, algoritme shipment capstone atau integrasi peta utama. Latihan memakai data
fiktif terpisah, tanpa GPS langsung, tanpa routing jalan atau tracking kurir real-time.
Server lokal hanya menyajikan allowlist file Day 19 dan aset brand/font yang sudah ada.

## Referensi

[Setup API](https://developers.google.com/maps/documentation/javascript/get-api-key),
[demo key](https://developers.google.com/maps/documentation/javascript/demo-key),
[load async](https://developers.google.com/maps/documentation/javascript/load-maps-js-api),
[markers](https://developers.google.com/maps/documentation/javascript/reference/advanced-markers),
[geocoding](https://developers.google.com/maps/documentation/javascript/geocoding),
[key security](https://developers.google.com/maps/api-security-best-practices).
