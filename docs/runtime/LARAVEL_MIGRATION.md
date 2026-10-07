# Migrasi runtime ke Laravel

Salinan React + PHP asli tidak diubah. Backup sebelum migrasi:
`Modules/Archives/Laravel Backup - before migration - 2026-10-01`.
Backup menyimpan source, konfigurasi lokal dan Git; dependency/build yang dapat dibuat ulang tidak diduplikasi.
Router dan launcher lama dipindahkan ke `retired-runtime` pada backup, bukan dihapus permanen.

## Yang berubah

- Laravel public/index.php, bootstrap, provider, controller dan route menggantikan server/router.php.
- Semua domain source dipindahkan ke backend/app/Domain. Tidak ada runtime backend React/Next.
- api_json mengembalikan Laravel JsonResponse melalui HttpResponseException, bukan echo/exit.
- Download bukti tiket memakai Laravel response download.
- SessionState menyimpan buffer domain pada session Laravel terenkripsi; tidak memakai native PHP session.
- Lookup identitas dicache hanya selama satu request, bukan lintas request/pengguna.
- Semua fetch API frontend memakai helper appFetch untuk header origin-boundary.
- Laravel exception/404/405/429 menghasilkan envelope JSON, tidak mengirim stack/credential ke UI.
- Vite menolak akses backend dan file konfigurasi/credential lokal.
- Launcher dev memeriksa port sebelum memulai kedua server.

## Yang tetap

Database bisnis PostgreSQL/Supabase, schema, RLS, auth Supabase, token user,
semua URL UI dan API, validasi domain, tracking/resolusi/notifikasi, tiket dengan foto,
impor/reconciliation atomik dan pembatalan, Finance, export CSV/JSON, peta, gambar kota,
carousel, role Admin/Seller/Konsumen, serta asisten operasi/fallback.
Tidak ada migrate/reset atau seed yang dijalankan pada database bisnis Supabase.
Database SQLite scaffold Laravel hanya lokal; session/cache runtime memakai file dan tidak bergantung padanya.

## Pengujian

52 unit tests frontend/domain tetap dipertahankan. Pengujian parser CSV dan peta kini
menggunakan response Laravel. Kasus ShipmentStatus lama dipindahkan ke PHPUnit.
Test backend memeriksa role unauthenticated, session persistence, cross-origin write,
header aplikasi, input login, route invalid, dan health runtime Laravel.
Browser QA menggunakan akun demo pada Supabase; tidak mereset dataset bisnis.
Detail hasil aktual dan keterbatasan ada output/laravel-qa/QA_REPORT.txt.

## Batas keamanan dan deployment

Tidak ada klaim kebal semua serangan. Wajib deploy lewat HTTPS dan document root backend/public,
APP_DEBUG=false, SESSION_SECURE_COOKIE=true, APP_KEY privat, pembatasan akses log,
monitoring serta backup database. Jangan memakai artisan serve sebagai server produksi.
External API dapat timeout/rate-limit; fallback yang sudah ada tetap tersedia.
