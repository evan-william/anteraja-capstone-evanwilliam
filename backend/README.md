# Backend Laravel

Folder ini menjalankan API dan sesi Anteraja. Frontend React/Vite berada di [frontend](../frontend); backend tidak memiliki build JavaScript terpisah.

## Menjalankan

Dari root proyek, gunakan `npm run dev` atau `run.bat`. Launcher menjalankan Vite dan PHP bersama. Untuk dua terminal terpisah, ikuti [panduan runtime](../LARAVEL_RUN.md).

## Lokasi kode

| Folder | Kegunaan |
| --- | --- |
| `routes/operations.php` | Endpoint `/api/*` dan middleware akses. |
| `app/Http` | Controller, sesi, pembatasan request, dan boundary HTTP. |
| `app/Domain` | Aturan autentikasi, tracking, tiket, Finance, impor, peta, dan asisten. |
| `app/Support` | Cache, bootstrap halaman, koneksi Supabase, dan dukungan runtime. |
| `config` | Konfigurasi Laravel; nilai rahasia berasal dari `.env`. |
| `tests` | Pengujian backend. |
| `public` | Document root; jangan menyajikan root proyek ke internet. |

`routes/web.php` menyajikan hasil build `../dist/index.html` untuk SPA. Aset produksi disalin launcher dari `../dist` ke `public`; sumber aset tetap berada di `../public`.

## Pengujian

Dari folder ini:

```powershell
& C:\xampp\php\php.exe artisan test
& C:\xampp\php\php.exe artisan route:list --path=api
```

Pengujian memakai SQLite in-memory dan cache array sesuai `phpunit.xml`. Database bisnis tetap Supabase/PostgreSQL dengan RLS. Jangan menjalankan `migrate:fresh`, reset, atau seed pada database remote hanya untuk merapikan proyek.

`composer run dev` mendelegasikan ke launcher root. `composer run setup` memasang dependency dan build frontend tanpa migrasi database bisnis; isi konfigurasi privat sebelum menjalankan aplikasi.
