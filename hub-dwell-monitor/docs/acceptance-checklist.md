# Bukti kebutuhan tugas

Gunakan daftar ini untuk memeriksa aplikasi dan menelusuri implementasinya, bukan sebagai jaminan nilai penilaian.

| Kebutuhan | File / bukti | Hasil |
|---|---|---|
| React dan Vite | package.json, src/main.jsx | Production build lulus |
| KPI global | src/metrics.js, KpiOverview.jsx | 8 hub; 2.182 visits; mean 6,12 jam; 5 prioritas |
| Top 3 angka mentah | src/metrics.js, TopHubs.jsx | Remote, Makassar, Denpasar |
| Minimal 6 hub | public/data/metrics.json, locations.json | 8 ID cocok; unit test join lulus |
| Marker interaktif | HubMap.jsx | 8 marker; popup dan tombol detail diuji |
| Detail lengkap | HubDetail.jsx | Mean/min/max, completed visits, prioritas, kualitas dan open visits |
| Filter list/map bersama | App.jsx, HubFilters.jsx | Satu visibleHubs; combined search/priority diuji |
| Loading/empty/error | useHubData.js, App.jsx | Request gagal, retry, data kosong dan search kosong diuji |
| Desktop dan mobile | docs/testing/browser-results.json | 35 pemeriksaan lulus; 1440px dan 390px |
| Keyboard dan fokus | HubDetail.jsx, src/styles.css | Escape, fokus kembali, skip link, input focus diuji |
| Metrics benar | tests/metrics.test.mjs | Mean dari completed visits; open visits tidak masuk; angka mentah untuk ranking |
| Output model aman | metrics.js, App.jsx | JSON validator; teks inert; instruksi nama tidak dieksekusi |
| Empat skenario model | docs/ai-testing/results.json | API nyata lulus; bukan screenshot UI AI Studio |
| Stitch v1/v2 | docs/stitch-design.json | Periksa screen ID dan export asli yang tercatat |
| Commit modular | Git branch feature/hub-dwell-monitor | Setup, implementasi, tests dan bukti mobile dipisah |
| PR dan review | PR #5 | Draft; persetujuan reviewer dan merge belum tersedia |

## Menjalankan pemeriksaan

Di folder hub-dwell-monitor, jalankan `npm test` dan `npm run build`. Saat `npm run dev` berjalan pada port 3020, buka terminal kedua dan jalankan `npm run qa`. Internet diperlukan untuk pengujian tile OpenStreetMap. Dashboard tidak membutuhkan login atau API key.

## Batas data

Dataset adalah simulasi September 2026 UTC. Koordinat adalah pusat kota, bukan alamat hub resmi. Threshold >6 jam adalah aturan latihan, bukan SLA resmi. Rata-rata tinggi tidak membuktikan akar penyebab; sampel kecil harus diaudit terlebih dahulu.
