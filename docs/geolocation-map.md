# Day 19 - Implementasi dan status verifikasi

Tanggal verifikasi terbaru: 9 Oktober 2026. Branch: `feature/geolocation-map`.
Baseline: `8-react-and-laravel`, commit `460ebbe`.

## Pemetaan terhadap soal

| Instruksi | Implementasi / bukti | Status aktual |
|---|---|---|
| shipment-map.html | Root repository; HTML semantic, CSS, ES modules | Dibuat |
| Google Maps JavaScript API | maps-loader.mjs; async loading, weekly, bahasa Indonesia | Lulus live dengan Maps Demo Key |
| Key aman dan restriction domain | config.local.js ignored; panduan HTTP referrer + API restriction | Tidak ada key di Git; restriction akun BELUM diverifikasi |
| Center Jakarta | app.mjs start(), -6.2088 / 106.8456, zoom 12 | Lulus live |
| Array shipment/courier | data.mjs: 9 kiriman, 3 kurir, 11 koordinat, 1 alamat-only | Lulus unit test |
| Satu marker per item | for...of addMarker; dedup id; AdvancedMarkerElement | 12 marker Google asli lulus live |
| InfoWindow resi/status | infoContent + gmp-click; textContent untuk data | Klik resi/kurir lulus live; keyboard lulus regression |
| Bonus geocoding | REST Geocoding v4, ANT-190009 alamat Monumen Nasional | Geocoding Google asli berhasil |
| Minimal 3 commit | Setup; marker/interaksi; tests/dokumentasi | Riwayat Git tersedia di laporan pengumpulan |
| Pull Request + review + merge | PR ke baseline terbaru, menunggu review sungguhan | Status GitHub dicatat di berkas pengumpulan; tidak mengarang review |

## QA yang benar-benar dijalankan

- `node --test exercises/geolocation-map/data.test.mjs`: **15 test lulus**.
- `node --check` app.mjs, maps-loader.mjs, data.mjs, server dan QA script: syntax check.
- Chrome regression: **34 check lulus**, **0 uncaught page exception**.
- Ukuran 375, 768, 1440px: tidak ada horizontal overflow, logo ter-load.
- Halaman tanpa key: pesan konfigurasi jelas; 12 data tetap dapat dibaca, pencarian,
  filter kurir, no-result empty state, dan keyboard selection bekerja.
- Marker/info/geocoder success, dedup, fitBounds terfilter, stale InfoWindow dan quota retry:
  **provider fixture khusus test**, bukan hasil Google Maps asli.
- Network API diblokir dalam test: pesan error dan retry manual, data tidak hilang.
- `.env.local`, backend/.env, .git/config, test file, frontend source tidak dapat dibuka
  melalui server latihan. POST ditolak 405; unknown/private path ditolak 404.
- Preferensi reduced-motion didukung, tanpa animasi atau retry request berulang.
- `node tools/verify-live-shipment-map.mjs`: Google Maps asli, Geocoding v4 asli,
  12 marker, detail paket/kurir dan filter list-map lulus. Tidak ada exception baru.
- Screenshot live 375/768/1440px ditinjau; map, popup, daftar dan kontrol tidak overflow.
  Attribution Google tetap terlihat; tidak disembunyikan atau dihapus.
- `git diff --check`: tidak ada whitespace error.

Output browser detail: `output/geolocation-map/browser-results.json` (lokal, ignored).
Paket submit menyertakan report JSON serta screenshot peta asli tanpa key.

## Perbaikan untuk Demo Key

JavaScript Geocoder lama ditolak pada key demo. REST Geocoding v4 berhasil dengan key
yang sama dan menjadi default. Alamat di-encode; key dikirim lewat header X-Goog-Api-Key;
field mask hanya meminta location/formattedAddress. AbortController membatalkan request
setelah 15 detik. Error kuota, izin, JSON rusak, koordinat invalid dan jaringan ditangani
tanpa mencetak body provider/key. Tidak ada retry otomatis atau koordinat palsu.

Hasil live untuk Monas: latitude -6.175308299999999, longitude 106.8271106.
`geocodingMode: "javascript"` tetap tersedia untuk key standar yang mendukung Geocoder lama.

## Yang belum bisa dinyatakan lulus

Peta dan geocoding asli sudah lulus. Restriction akun belum terverifikasi: uji v4 dengan
referrer lokal menghasilkan HTTP 200, tetapi referrer https://example.invalid/ juga
diterima (200). Karena itu pembatasan domain belum dapat diklaim aman.

Pemilik perlu memeriksa Application/API restrictions di Google Cloud dan menyediakan
screenshot tanpa key. Jika Demo Key tidak menyediakan setting yang diminta soal,
jelaskan batas prototype kepada mentor atau gunakan key kelas/standar yang dibatasi.
Jangan aktifkan billing tanpa persetujuan pemilik. Git ignore tidak membuat key browser
menjadi rahasia atau aman untuk produksi. Respons API bukan pengganti bukti setting akun.

PR #4 masih menunggu review/merge nyata. Nilai ditentukan mentor; jangan membuat review
palsu atau mengklaim seluruh kriteria/100 terpenuhi sebelum bukti eksternal dilengkapi.

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
[geocoding v4](https://developers.google.com/maps/documentation/geocoding/geocoding),
[key security](https://developers.google.com/maps/api-security-best-practices).
