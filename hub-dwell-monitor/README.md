# Anteraja Hub Dwell Monitor

Bandingkan waktu tunggu hub, lihat lokasi, dan pilih prioritas investigasi dari data completed visits.

## Fitur

- **KPI:** 8 hub, 2.182 completed visits, mean global berbobot 6,12 jam, 5 hub prioritas.
- **Ranking:** Top 3 memakai angka mentah; Hub Remote diberi peringatan sampel 2 visits.
- **Filter bersama:** pencarian dan Priority Only mengubah daftar serta marker sekaligus.
- **Detail:** klik daftar atau marker untuk mean/min/max, jumlah visits dan kualitas data.
- **State:** loading, empty, error, retry, dan ringkasan yang ditampilkan sebagai teks.

## Jalankan

Gunakan Node.js 22 dan npm. Buka PowerShell:

```powershell
cd "D:\Work & Organization\Work\Maxy Academy\Modules\Daily Module\Day 20\repository\hub-dwell-monitor"
npm ci
npm run dev
```

Buka http://127.0.0.1:3020/. Hentikan dengan Ctrl+C. Tidak perlu login, database, Docker, atau API key untuk menjalankan dashboard. Internet diperlukan untuk tile OpenStreetMap.

## Uji dan build

```powershell
npm test
npm run build
```

Di terminal kedua saat server berjalan, jalankan `npm run qa`. QA memakai Chrome terpasang; set `PW_CHANNEL` jika menggunakan channel lain. Bukti disimpan di `screenshots/` dan `docs/testing/browser-results.json`.

## Data dan komponen

```text
App (query, priorityOnly, selectedId, revision)
  useHubData -> metrics.json + locations.json + ai-summary.json
  KpiOverview <- globalKpi(all hubs)
  TopHubs <- ranked(all hubs)
  HubFilters -> query + priorityOnly
  HubList <- visibleHubs
  HubMap <- visibleHubs (array yang sama)
  HubDetail <- selected hub_id
```

`src/metrics.js` menghitung mean berbobot total dwell/completed visits dan mengurutkan raw numbers. `tools/prepare-data.mjs` membuat JSON dari export Spark Day 18 yang disalin utuh ke `data-source/`. Open visits tidak masuk mean. Koordinat merupakan titik kota simulasi, bukan alamat hub resmi. Threshold **>6 jam** hanya aturan latihan, bukan SLA.

## Konfigurasi ringkasan

Dashboard membaca ringkasan JSON yang sudah diuji, bukan memanggil model dari browser. Untuk menjalankan ulang empat tes, gunakan `GEMINI_API_KEY` atau `GEMINI_ENV_FILE` secara lokal; opsional `GEMINI_MODEL`. Jangan memakai variabel `VITE_` untuk secret. Lihat [cara pengujian ringkasan](docs/ai-testing/how-to-test.md).

## Dokumen dan bukti

- [Laporan tugas](docs/hub-dwell-monitor.md)
- [Screenshot desktop](screenshots/desktop.png) dan [mobile](screenshots/mobile.png)
- [Hasil empat tes terstruktur](docs/ai-testing/results.json)
- [Desain Stitch dan screen ID](docs/stitch-design.json): export asli v1/v2 desktop dan mobile tersedia.
- [Checklist kebutuhan dan bukti](docs/acceptance-checklist.md)
- [Pull Request #5](https://github.com/evan-william/anteraja-capstone-evanwilliam/pull/5): review/merge menunggu persetujuan partner.
- Branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/hub-dwell-monitor

## Lisensi

Kode latihan mengikuti hak repository capstone pemiliknya; tidak menambahkan lisensi distribusi baru. Leaflet BSD-2-Clause dan React MIT tersedia pada dependency masing-masing. Peta memakai atribusi OpenStreetMap; aset merek tetap milik Anteraja.
