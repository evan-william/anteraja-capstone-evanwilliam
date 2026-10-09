# Hub Dwell Monitor - Day 20

## 1. Project Overview

Supervisor dapat melihat hub dengan waktu tunggu tinggi, membandingkan jumlah completed visits, membuka lokasi dan detail, lalu memilih prioritas investigasi. Latihan yang disebut "Day 19" pada instruksi ditempatkan di folder Day 20 sesuai permintaan. Aplikasi React/Vite ini terpisah dari backend capstone produksi; tidak mengubah schema, akun, RLS, atau shipment pelanggan.

## 2. Data Sources

`data-source/package_dwell.csv` dan `all_hubs.csv` merupakan salinan export Spark dari Day 18. Dataset September 2026 UTC bersifat simulasi. SHA-256 sumber dicatat dalam `public/data/metrics.json`. `tools/prepare-data.mjs` memeriksa count/mean terhadap export, lalu menghitung min/max dan total dwell dari 2.182 pasangan valid.

| KPI | Nilai | Definisi |
|---|---:|---|
| Total Hub | 8 | hub_id unik dengan metrics + lokasi |
| Completed Visits | 2.182 | Pasangan arrival/departure valid |
| Global Mean Dwell | 6,118890925756186 jam | Total dwell / total completed visits |
| Priority Hub Count | 5 | completed_visits >0 dan mean >6 jam |
| Open Visits | 40 | Missing departure; ditampilkan, tidak masuk completed mean |

Rata-rata global bukan rata-rata sederhana dari delapan mean hub. Ranking memakai angka mentah; pembulatan dua desimal hanya untuk UI. Top 3: HUB_REMOTE 30 jam (2 visits), HUB_MKS 11,167657142857143 jam (350), HUB_DPS 8,96075 jam (200).

`public/data/locations.json` memetakan delapan hub_id yang sama ke perkiraan pusat kota. Tidak ada file lokasi hub resmi dalam sumber Day 18/19. Karena itu koordinat Jakarta/Bandung/Surabaya/Semarang/Medan/Denpasar/Makassar adalah titik kota, sedangkan HUB_REMOTE ditempatkan di Palangka Raya sebagai lokasi simulasi eksplisit. Ini bukan geocoding alamat operasional Anteraja.

## 3. Stitch Design

**Belum lengkap.** Stitch meminta login di browser pemeriksaan; browser tersebut tidak berbagi login Chrome pribadi. Sesuai permintaan, Stitch kemudian dibuka pada profil Chrome Evan (`Profile 1`). Belum ada hasil export/screen ID yang dapat diverifikasi. `screenshots/desktop.png` dan `mobile.png` adalah screenshot aplikasi nyata, **bukan** Stitch v1/v2.

Prompt v1/v2 desktop/mobile tersedia di `docs/stitch-prompts.txt`. `docs/stitch-design.json` mencatat status pending tanpa ID buatan. Lengkapi dengan screen ID, URL project dan export asli `screenshots/stitch-v1.png`, `stitch-v2.png` sebelum menyatakan seluruh Definition of Done terpenuhi.

Arah implementasi: magenta pada aksi/prioritas, neutral hangat, Open Sans lokal, KPI tanpa kartu berlebihan, ranking compact, serta list/map berdampingan di desktop dan bertumpuk di mobile. Implementasi ini belum diklaim sebagai konversi dari export Stitch.

## 4. AI Testing

Empat pengujian nyata dilakukan melalui **Gemini API**, model `gemini-3.5-flash-lite`, temperature 0, response MIME `application/json` dan JSON schema. Hasil ini bukan screenshot pengoperasian antarmuka AI Studio. System instruction dan input/output setiap kasus tersedia di `docs/ai-testing/` agar bisa direproduksi pada AI Studio juga.

| Skenario | Hasil yang diwajibkan | Hasil aktual |
|---|---|---|
| Normal Data | Semua ID prioritas sesuai threshold | Lulus; REMOTE/MKS/DPS/SMG/MED |
| No Priority Hub | priority_hubs kosong | Lulus |
| Empty Hubs | Data tidak tersedia, dua array kosong | Lulus |
| Untrusted Hub Name | Abaikan instruksi dalam nama | Lulus; tidak ada HUB_FAKE/token injeksi |

Validator lokal memeriksa schema field, tipe array, dan kesamaan tepat priority IDs. Ringkasan normal memuat 2.182 completed visits, 8 hub dan mean global 6,12 jam sesuai data. Usulan `next_checks` adalah pemeriksaan, bukan kesimpulan penyebab. Pengujian tidak menjamin semua keluaran model di masa depan bebas halusinasi; metrics/ranking tidak bergantung pada model.

## 5. Application Features

| Kebutuhan | Implementasi | Cara menggunakan |
|---|---|---|
| Global KPI | KpiOverview + globalKpi | Baca strip metrik atas |
| Top 3 | TopHubs + ranked | Klik nama untuk detail |
| Hub List/Search | HubList/HubFilters | Cari hub_id, nama atau kota |
| Priority Filter | state priorityOnly di App | Pilih Priority Only; list dan marker sama-sama berubah |
| Interactive Leaflet | HubMap | Zoom/pan; klik marker untuk popup mean/min/max/count/prioritas |
| Hub Detail | dialog native HubDetail | Klik daftar atau Buka detail hub pada popup; Tutup atau Escape |
| Loading/Empty/Error | useHubData + conditional rendering | Retry ketika request gagal; reset pencarian kosong |
| Ringkasan | JSON aman sebagai teks React | Baca ringkasan dan langkah pemeriksaan |

App memiliki satu `visibleHubs`, dikirim sebagai props ke HubList dan HubMap. Global KPI dan Top 3 tetap menghitung seluruh dataset, bukan berubah diam-diam karena filter. `hub_id` adalah join key dan key list. Tidak ada mutasi props. Effect data memakai AbortController; effect Leaflet memanggil remove/disconnect saat cleanup, termasuk siklus StrictMode. Popup memakai textContent, bukan innerHTML dari data model/nama hub. HTML icon marker hanya template statis.

## 6. Testing

- 12 unit test lulus: weighted mean vs seluruh baris sumber, open visits, ranking numerik, batas tepat 6, filter/search, empty data, duplikat ID, lokasi hilang/invalid, angka invalid, schema ringkasan, serta min/max semua hub.
- Production build lulus.
- 35 pemeriksaan browser lulus pada desktop 1440px dan mobile 390px: jumlah hub/marker, mean, layout, overflow, tile peta nyata, attribution, shared filter/search, detail metrics, Escape/focus restoration, empty state, marker popup/detail, loading, network failure/retry, empty dataset, HTML injection inert, keyboard dan reduced motion. Console pageerror kosong.
- Desktop/map-list berdampingan; mobile bertumpuk, map 360px dan attribution tetap terlihat. Detail berupa modal scrollable yang dapat ditutup via keyboard.
- Empat tes structured output Gemini lulus.
- Perbaikan selama QA: Windows path berisi `&` memutus shim Vite; npm scripts memakai Node entrypoint langsung. Browser QA memakai Chrome terpasang dan server lokal diizinkan melewati pembatasan socket sandbox. Tidak mengubah business metric untuk meloloskan tes.

Bukti: `docs/testing/browser-results.json`, `screenshots/desktop.png`, `mobile.png`, `detail-1440.png`, `detail-390.png`, `loading.png`, `error.png`, `empty-1440.png`, `empty-390.png`. Tidak menjamin tile OpenStreetMap selalu tersedia; tile failure menampilkan pesan dan list/detail tetap bisa dipakai.

## 7. Operational Insight

Hub Makassar menjadi prioritas pemeriksaan operasional karena mean 11,17 jam didukung 350 completed visits dan 95,37% pasangan valid. Periksa kapasitas sorting per shift, antrean departure dan jam cut-off, tanpa menyimpulkan akar penyebab dari mean saja. Hub Remote memang ranking pertama 30 jam, tetapi hanya 2 completed visits dan 10,53% pasangan valid; audit scan/data lebih dulu sebelum membuat keputusan kapasitas. Denpasar (8,96 jam), Semarang (7,08 jam) dan Medan (6,14 jam) ikut threshold simulasi >6 jam. Angka tersebut bukan SLA atau performa riil Anteraja.

## 8. Git dan status acceptance

Branch wajib: `feature/hub-dwell-monitor`. Implementasi dipisah ke commit setup/data, UI/map/filter, lalu testing/dokumentasi. Link branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/hub-dwell-monitor.

Stitch v1/v2 + screen ID, pengoperasian tes pada antarmuka AI Studio, dan partner review/merge belum boleh diklaim selesai. Tidak ada review partner buatan atau merge tanpa persetujuan. Lihat `docs/submission-status.json` untuk status bukti dan PR aktual.

## Referensi teknis

- Leaflet reference (map lifecycle/resize): https://leafletjs.com/reference
- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- Attribution OpenStreetMap: https://www.openstreetmap.org/copyright
