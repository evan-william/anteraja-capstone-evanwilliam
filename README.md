# Anteraja Tracking & Operations

## Day 19 - Google Maps geolocation

Latihan terbaru: [shipment-map.html](shipment-map.html). Jalankan
`node tools/serve-shipment-map.mjs`, lalu buka http://localhost:3019/shipment-map.html.
[Setup key dan demo](exercises/geolocation-map/README.md) · [Status verifikasi](docs/geolocation-map.md).
Dataset latihan terpisah; fitur/database capstone tidak diubah.

Salinan ini memakai React + Vite untuk antarmuka dan Laravel 12 untuk API, sesi, autentikasi, validasi, impor bank, tracking, dan asisten Admin. Database tetap PostgreSQL/Supabase yang sama; skema dan RLS tidak diubah. Versi React + PHP tetap terpisah dan tidak ditimpa. Panduan runtime saat ini: [LARAVEL_RUN.md](LARAVEL_RUN.md).

Capstone ini mengubah tracking dari daftar status pasif menjadi alur yang memberi kepastian dan jalan keluar. Penerima dapat memahami risiko, memperbarui petunjuk alamat, mengatur jadwal atau safe drop, membuat tiket CS berkonteks, dan memilih notifikasi. Seller mendapat control tower; Finance/Rekonsiliasi FRD-06 tetap tersedia sebagai modul pendukung yang menghubungkan resi, COD, settlement, dan mutasi bank.

## Jalankan

Di PowerShell, buka folder ini lalu jalankan:

```powershell
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Isi `.env.local` dengan `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` dari proyek Supabase yang sudah memiliki migrasi. Konfigurasi lama `NEXT_PUBLIC_…` masih kompatibel. Di backend jalankan `composer install`, salin `.env.example` menjadi `.env`, lalu `php artisan key:generate`. Jangan commit credential. Panduan lengkap: [LARAVEL_RUN.md](LARAVEL_RUN.md).

Demo: buka `http://localhost:3000/lacak`, gunakan resi `ANT-100015` dan kode `260926`. Ruang Seller memakai akun demo lama. Untuk tiga akun demo, peran, dan kode aktivasi lihat [panduan RBAC](docs/product/RBAC_GUIDE.txt). Jangan menjalankan `db reset` pada project remote: perintah itu menghapus data.

Ada 300 resi fiktif tambahan (`ANT-200001`–`ANT-200300`) di `supabase/seed-demo-shipments.sql`. Jalankan setelah seed dasar pada database demo; panduan contoh resi ada di `docs/prototype/DEMO_SHIPMENTS.md`.

Detail kiriman kini memiliki [peta perjalanan](docs/prototype/ROUTE_MAP.md) yang menampilkan jalur jalan perkiraan. Untuk produksi, konfigurasi `ROAD_ROUTER_URL` ke router OSRM ber-SLA; tanpa konfigurasi, aplikasi menggunakan layanan demo publik dan tetap menampilkan titik kota/hub saat layanan rute tidak tersedia.

| Area | Rute | Fungsi |
|---|---|---|
| Tracking publik | `/lacak` | Cari resi dengan kode akses |
| Detail tracking | `/lacak/[awb]` | Timeline, risiko, resolusi, notifikasi, tiket CS |
| Operasi seller | `/pengiriman` | Filter, pencarian, ekspor CSV/JSON |
| Finance | `/transaksi` | Arus dana settlement dan biaya |
| Rekonsiliasi | `/import` | Preview/simpan/batal impor FRD-06 |
| Kategori | `/kategori` | Klasifikasi keuangan |
| Pusat operasi | `/admin` | Prioritas kiriman lintas Seller |
| Tiket CS | `/admin/tiket` | Penanganan bertahap dengan audit |
| Operasi Admin | `/admin`, `/admin/kiriman`, `/admin/tiket` | Pantau kiriman dan tangani tiket masuk |
| Asisten operasi Admin | Semua halaman `/admin` | Tanya data kiriman/tiket dan konfirmasi perubahan status; [panduan konfigurasi](docs/product/ADMIN_ASSISTANT.md) |
| Ruang Seller | `/seller` | Ringkasan kiriman dan Finance milik akun |
| Paket saya | `/akun` | Hanya paket Konsumen yang ditautkan |
| Aktivasi Admin | `/aktivasi-admin` | Tukar kode resmi setelah login |

PHP menangani seluruh rute `/api/*`; React + Vite menangani halaman dan state UI. Supabase menyediakan Auth, PostgreSQL, RLS, dan RPC atomik. Tracking publik memeriksa kode akses, menyamarkan data penerima, dan memakai pembatasan request. RPC database menulis resolution, event, dan integration outbox dalam satu transaksi. Demo tidak memakai API internal Anteraja.

Seluruh kode antarmuka berada di `frontend/`: halaman di `pages/`, komponen di `components/`, dan helper/type di `lib/`. Backend berada di `backend/app/` dengan endpoint di `backend/routes/operations.php`. Alias `@/` menunjuk ke `frontend/`. `npm run dev`, `npm run build`, dan `npm run start` memakai satu build Vite dan backend Laravel; tidak ada build Vite kedua di backend.

Untuk mencari file yang perlu diedit, baca [peta struktur proyek](docs/architecture/PROJECT_STRUCTURE.md). [Indeks dokumentasi](docs/README.md) memisahkan panduan runtime, requirement produk, dan bukti tugas historis.

Tugas Python/Data Mining dan Big Data berada di folder `Daily Module/Day 17` dan `Daily Module/Day 18`, pada branch tugas masing-masing. Notebook latihan tersebut **belum menjadi fitur prediksi pada aplikasi ini**. Jangan menganggap tugas yang selesai otomatis terintegrasi ke runtime.

Penyesuaian dari modul PHP mentor, termasuk logika ETA di PHP dan foto bukti tiket CS, dijelaskan di [panduan penerapan PHP](docs/runtime/PHP_MENTOR_GUIDE.md).

## Pemeriksaan

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run audit:usage
```

Dokumen: [PRD terpadu](docs/product/prd.md), [FRD terpadu](docs/product/frd.md), [keputusan produk](docs/product/decisions.md), [desain UI](docs/design/ui-design.md), [dokumentasi prototype](docs/prototype/README.md), [pemetaan halaman ke FRD](docs/prototype/PAGE_FRD_MAPPING.md), [selector JavaScript/jQuery](docs/prototype/SELECTOR_REFERENCE.md), [setup database](database/DATABASE_RUN.md), dan [ERD](database/ERD.md).
