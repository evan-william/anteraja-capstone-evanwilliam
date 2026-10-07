# Peta struktur proyek

Cari tampilan di `frontend/`, aturan server di `backend/`, dan requirement di `docs/product/`. Peta ini ditujukan untuk kamu yang ingin mengubah satu bagian tanpa harus membaca seluruh aplikasi.

## Folder utama

```text
Final Project Full - React + Laravel/
  frontend/                 sumber React dan CSS
    pages/                  komposisi halaman per area
    components/             komponen UI dan fitur
      ui/                   tombol, form, navigasi, carousel
      tracking/             pencarian, timeline, peta, dashboard, tiket
      admin/                asisten operasi
      transaksi/            form dan daftar arus dana
      kategori/             form dan daftar kategori
      import/               preview dan riwayat rekonsiliasi
    lib/                    helper, validasi, tipe data
    compat/                 adapter Link/Image/navigation untuk React Router
    App.tsx                 route map, guard role, shell Admin
    main.tsx                entrypoint React dan BrowserRouter
    api.tsx                 auth context dan pemuatan data halaman
    http.ts                 boundary fetch yang dipakai komponen
    bootstrap.ts            penggabungan kebutuhan data awal halaman
    shared-read.ts          deduplikasi request baca
    globals.css             token, layout, dan styling bersama
  backend/                  Laravel, dependency Composer, konfigurasi server
    app/Domain/             aturan bisnis dan panggilan layanan
    app/Http/               controller dan middleware HTTP
    app/Support/            cache, bootstrap, koneksi, dukungan request
    routes/                 URL API dan entrypoint SPA produksi
    tests/                  pengujian PHP
    public/                 document root backend
  public/                   sumber logo, favicon, font, dan foto
  tests/unit/               pengujian frontend dan kontrak domain
  tools/                    launcher, QA, benchmark, audit, Redis lokal
  database/                 snapshot SQL, ERD, dan panduan database
  supabase/                 sejarah migrasi dan seed kompatibel Supabase
  docs/                     produk, desain, runtime, arsitektur, bukti
  bukti/                    bukti FRD-06 awal yang dipertahankan
  output/                   hasil pengujian dan laporan yang dihasilkan alat
  .private/                 log, bukti foto tiket, runtime Redis, credential lokal
  node_modules/             dependency frontend; hasil instalasi
  dist/                     hasil build Vite; jangan diedit manual
```

## Lokasi edit berdasarkan kebutuhan

| Yang ingin kamu ubah | File atau folder awal |
| --- | --- |
| Warna, font, jarak, animasi bersama | `frontend/globals.css` |
| Login/register | `frontend/pages/AuthPages.tsx`, `frontend/components/ui/auth-carousel.tsx` |
| Menu utama/submenu | `frontend/components/ui/nav-links.tsx`, `site-header.tsx` pada folder yang sama |
| Tracking publik dan formulir tindak lanjut | `frontend/pages/PublicPages.tsx`, `frontend/components/tracking/tracking-experience.tsx` |
| Peta dan foto kota | `frontend/components/tracking/journey-map.tsx`, `frontend/lib/tracking/city-imagery.ts` |
| Dashboard Admin/Seller/Konsumen dan tiket | `frontend/pages/RolePages.tsx`, `frontend/components/tracking/` |
| Asisten Admin | `frontend/components/admin/operations-assistant.tsx`, `backend/app/Domain/Assistant.php` |
| Finance, kategori, rekonsiliasi | `frontend/pages/FinancePages.tsx`, komponen fitur terkait, `backend/app/Domain/Finance.php` dan `Imports.php` |
| Endpoint baru atau controller | `backend/routes/operations.php`, `backend/app/Http/Controllers/OperationsController.php` |
| Koneksi Supabase atau cache | `backend/app/Domain/Supabase.php`, `backend/app/Support/` |
| Cara menjalankan atau mengukur performa | `tools/`, [panduan run](../../LARAVEL_RUN.md), [panduan performa](../runtime/PERFORMANCE.md) |

Alias `@/components/...` dan `@/lib/...` selalu berasal dari `frontend/`. TypeScript, Vite, dan Vitest memakai target alias yang sama. Jangan membuat folder `components/` atau `lib/` kedua di root.

## Batas antarmuka dan server

React menangani input, loading/error, navigasi, dan export CSV/JSON. Request melewati `frontend/http.ts` menuju `/api/*`. Vite memproksikan request tersebut ke Laravel saat development; Laravel menyajikan SPA hasil build saat `npm start`.

Laravel memeriksa sesi/role dan validasi, lalu domain memanggil Supabase Auth/PostgREST/RPC atau penyedia peta/asisten. PostgreSQL/RLS tetap membatasi data berdasarkan akun. Jangan pindahkan credential backend ke variabel `VITE_*` karena variabel tersebut masuk bundle browser.

`compat/` bukan backend React atau Next.js yang tidak dipakai. Komponen fitur masih mengimpor adapter tersebut agar Link, gambar, dan refresh data bekerja di React Router tanpa mengubah kontraknya.

## File dukungan yang bukan kode halaman

`database/` dan `supabase/` tidak otomatis menjadi duplikasi: yang pertama menyimpan snapshot/referensi lengkap untuk tugas database, yang kedua menyimpan migrasi berurutan dan seed. Keduanya dipertahankan tanpa mengubah schema atau menjalankan seed.

Dokumentasi, template keputusan, fixture CSV, dan screenshot historis tidak harus diimpor aplikasi untuk dianggap berguna. `node_modules/`, `backend/vendor/`, `dist/`, `backend/public/assets/`, dan cache Laravel merupakan hasil instalasi/build, bukan sumber yang perlu dirapikan manual. File konfigurasi Laravel juga dapat dipakai framework melalui konvensi, bukan import eksplisit.

## Tugas data dan versi aplikasi

Folder ini adalah aplikasi Full terbaru berbasis React + Laravel (PHP). Versi Full PHP biasa dan Mini tetap berada di folder masing-masing. Notebook Python Day 17 dan PySpark Day 18 berada di `Modules/Daily Module` dengan dataset simulasi serta branch tugas; tidak ada endpoint prediksi ML/PySpark yang otomatis berjalan di aplikasi Full.

Mengintegrasikan model tersebut nantinya memerlukan kontrak data dan layanan yang diuji terpisah. Audit organisasi ini tidak menambahkan fitur baru atau mengubah PRD/FRD.
