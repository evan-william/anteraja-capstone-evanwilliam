# Day 19 - Peta lokasi pengiriman

Halaman HTML, CSS, dan JavaScript biasa. Memakai **Google Maps JavaScript API asli**,
AdvancedMarkerElement, InfoWindow, dan Google Geocoding v4. Bukan Leaflet atau screenshot peta.
Latihan berdiri sendiri; database, API Laravel, login, PRD dan FRD capstone tidak diubah.

Branch: [feature/geolocation-map](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/geolocation-map).

## Jalankan

Dari root repository Day 19:

```powershell
node tools/serve-shipment-map.mjs
```

Buka http://localhost:3019/shipment-map.html. Tidak perlu npm install, React, Laravel,
atau Supabase untuk menjalankan halaman ini. Node hanya menyajikan file lokal.
Ctrl+C menghentikan server. Jangan buka HTML dengan file:// karena restriction key
memerlukan origin HTTP yang benar.

## Key resmi milik sendiri

Key Maps web memang terlihat di browser dan Network. Mengabaikan file di Git **tidak
menggantikan restriction Google Cloud**. Jangan memakai Gemini API key atau key orang lain.

1. Pilihan prototype: [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key).
   Google menyediakan opsi tanpa memasukkan billing; login, penerimaan syarat, batas kuota
   dan ketersediaan fitur tetap berlaku. REST Geocoding v4 menjadi default dan sudah
   berhasil diuji live dengan Demo Key pada 9 Oktober 2026.
2. Jalur standar alternatif: buat project Google Cloud milikmu,
   tautkan billing bila diminta, aktifkan **Maps JavaScript API** dan **Geocoding API**.
   Pembayaran/akun harus diputuskan pemilik, bukan diaktifkan diam-diam oleh skrip latihan.
3. APIs & Services > Credentials > key khusus Day 19 > Application restrictions > Websites.
   Tambahkan hanya `http://localhost:3019/*` dan `http://127.0.0.1:3019/*`.
   Jangan pakai wildcard seluruh domain atau pembatasan IP untuk key browser.
4. API restrictions > Restrict key > hanya Maps JavaScript API dan Geocoding API v4.
   Simpan. Atur quota per API sesuai kebutuhan latihan. Budget alert bukan batas biaya keras.
5. Salin `config.example.js` menjadi `config.local.js` di folder ini jika belum ada.
   Isi `apiKey` di file lokal. Biarkan `mapId: "DEMO_MAP_ID"` untuk uji Advanced Markers.
   `DEMO_MAP_ID` adalah map ID contoh resmi, **bukan API key**. Default geocoding adalah
   `v4` walaupun field geocodingMode tidak diisi. Pilih `javascript` hanya untuk key standar
   yang mendukung Geocoder lama; tidak ada perpindahan provider diam-diam.
6. Refresh halaman. Periksa peta sungguhan, 12 titik, detail klik marker, dan teks geocoding
   berhasil. Ambil screenshot restriction dengan key/ID akun disamarkan.
7. Key lokal tidak ikut commit atau ZIP. Jika sudah bocor, rotate/revoke; jangan hanya hapus file.

## Data dan cara demo

`data.mjs` berisi 9 kiriman + 3 kurir, semua fiktif. Sebelas item mempunyai lat/lng;
ANT-190009 hanya punya alamat Monumen Nasional. Tidak ada pemanggilan GPS pelanggan/kurir.

- Buka halaman: center awal Jakarta (-6.2088, 106.8456); fitBounds menyesuaikan titik.
- Klik marker ANT-190003: resi, status Perlu tindakan, lokasi, kurir, alasan kendala.
- Klik kurir: nama, status tugas, lokasi dan koordinat.
- Gunakan pencarian resi/kota/kurir/status atau filter jenis. Marker ikut disaring.
- Pilih nama lokasi menggunakan Tab + Enter jika lebih nyaman daripada mengklik peta.
- Geocoding v4 otomatis dipanggil satu kali setelah peta siap. Jika berhasil, ANT-190009
  menjadi marker ke-12. Tombol retry hanya untuk percobaan manual setelah gagal.
- Kuota/geocoding gagal: 11 marker valid tetap tersedia, tanpa koordinat palsu.
- Key kosong/peta gagal: daftar masih dapat dibaca; halaman tidak mengklaim peta sudah bekerja.

Legenda P = paket dan K = kurir; status selalu disertai teks, bukan warna saja.
Hijau berarti terkirim, amber berarti kendala, magenta kiriman lain, warna gelap kurir.
Google copyright/attribution bawaan tetap terlihat saat peta dimuat.

## Peta file

| File | Kegunaan |
|---|---|
| `../../shipment-map.html` | Kerangka semantic, sidebar, canvas map, status dan kontrol |
| `data.mjs` | Array readonly, label status, validasi koordinat, filter |
| `maps-loader.mjs` | Memuat Google async, timeout/network/auth handling, geocoding |
| `app.mjs` | Loop marker, InfoWindow aman via textContent, sinkronisasi list-map |
| `style.css` | CSS readable, identitas magenta, breakpoint mobile/tablet/desktop |
| `config.example.js` | Template tanpa key |
| `config.local.js` | Key lokal, Git ignored, tidak ada di ZIP |
| `data.test.mjs` | Unit tests memakai provider test-double, bukan bukti Google live |
| `../../tools/serve-shipment-map.mjs` | HTTP server allowlist; .env/backend/.git ditolak |
| `../../tools/qa-shipment-map.mjs` | Pengujian browser dan screenshot state tanpa key |
| `../../tools/verify-live-shipment-map.mjs` | Uji peta asli, 12 marker, geocoding dan filter |
| `../../tools/verify-map-key-security.mjs` | Uji penerimaan/refusal referrer tanpa mencetak key |

## Uji dan bukti

```powershell
node --test exercises/geolocation-map/data.test.mjs
node --check exercises/geolocation-map/app.mjs
node --check exercises/geolocation-map/maps-loader.mjs
```

QA browser membutuhkan Playwright yang sudah terpasang. Pasang dependency test terpisah
jika perlu atau set `PLAYWRIGHT_PATH` ke modul @playwright/test yang sudah tersedia.
Jalankan server dahulu, lalu `node tools/qa-shipment-map.mjs` dari root repo.
QA ini khusus **skenario regression**: marker/geocoding success memakai fixture
test-only; bukan bukti layanan Google sukses. Output ditulis ke `output/geolocation-map/`.
Provider fixture tidak masuk ke app, tidak disajikan oleh server, dan tidak dipakai
sebagai screenshot peta asli. Lihat [hasil/status verifikasi](../../docs/geolocation-map.md).

Uji live: `node tools/verify-live-shipment-map.mjs` (Chrome terpasang).
Jika root belum npm install, set PLAYWRIGHT_PATH ke dependency @playwright/test yang tersedia.
Key web terlihat di browser; restriction akun tetap diperlukan. Uji 9 Oktober menunjukkan
referrer luar masih diterima oleh v4, sehingga bukti pembatasan domain belum terpenuhi.
Jangan gunakan Demo Key untuk deployment produksi atau mengunggah config.local.js.

## Troubleshooting

| Kondisi | Periksa |
|---|---|
| Menunggu key | apiKey kosong; isi config.local.js lalu refresh |
| RefererNotAllowedMapError | Origin/port sesuai kedua restriction URL |
| ApiNotActivatedMapError | Maps JavaScript API aktif pada project key |
| BillingNotEnabledMapError | Billing/key demo sesuai fitur yang dipanggil |
| REQUEST_DENIED pada Geocoder | Geocoding API aktif/diizinkan, jenis key mendukung |
| OVER_QUERY_LIMIT / quota | Tunggu quota; tidak ada retry otomatis berulang |
| ZERO_RESULTS | Alamat tidak ditemukan; periksa tempat/kota |
| Timeout/network | Internet/extension/firewall; retry manual |
| Port dipakai | Hentikan server Day 19 lama; jangan membunuh server lain sembarang |

## Referensi resmi

- [Memuat API](https://developers.google.com/maps/documentation/javascript/load-maps-js-api)
- [Advanced markers](https://developers.google.com/maps/documentation/javascript/reference/advanced-markers)
- [Geocoding](https://developers.google.com/maps/documentation/javascript/geocoding)
- [Pembatasan key](https://developers.google.com/maps/api-security-best-practices)
- [Setup dan demo key](https://developers.google.com/maps/documentation/javascript/get-api-key)

## Git dan pengumpulan

Tiga commit dipisahkan: setup/data/server, peta/interaksi, lalu tests/dokumentasi.
PR ditujukan ke `8-react-and-laravel` karena itulah baseline Full terbaru.
Review partner dan merge hanya dilakukan sesudah persetujuan nyata; tidak dibuat-buat.
PDF/ZIP dan petunjuk unggah berada di folder `Day 19/submit` di luar root Git.
