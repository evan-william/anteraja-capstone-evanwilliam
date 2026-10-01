# React + Laravel

React/Vite hanya frontend. Semua endpoint API dijalankan Laravel 12 (PHP 8.2+).
Database bisnis tetap PostgreSQL/Supabase dengan token pengguna dan RLS yang sama; tidak ada migrasi ulang database bisnis.

## Menjalankan salinan lokal yang sudah disiapkan

```powershell
cd "D:\Work & Organization\Work\Maxy Academy\Modules\Final Project Full - React + Laravel"
npm run dev
```

Frontend http://127.0.0.1:3000; Laravel http://127.0.0.1:8089/api/health.
Jika server versi PHP masih memakai port itu, hentikan server lama dengan Ctrl+C atau:

```powershell
$env:PORT='3002'; $env:API_PORT='8090'; npm run dev
```

## Dua terminal terpisah

Terminal backend:
```powershell
cd "D:\Work & Organization\Work\Maxy Academy\Modules\Final Project Full - React + Laravel\backend"
& C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8089
```

Terminal frontend: cd ke root proyek, lalu `npm exec vite -- --host 127.0.0.1 --port 3000`.

## Instalasi dari checkout baru

`npm ci`; masuk backend, `composer install`, salin .env.example menjadi .env,
`php artisan key:generate`. Salin root .env.example menjadi .env.local dan isi konfigurasi Supabase/Gemini.
Key Supabase publishable tidak menggantikan token per-user; service-role tidak dipakai.
Session/cache Laravel memakai file lokal, sehingga backend capstone tidak perlu `artisan migrate`.
Jangan migrasikan tabel users bawaan Laravel ke Supabase; auth bisnis tetap Supabase.

## Arsitektur

Vite /api proxy -> Laravel public/index.php -> routes/operations.php -> OperationsController
-> Domain -> Supabase auth/PostgREST/RPC.

Laravel menangani routing, lifecycle request/response, exception, throttle, dan encrypted session.
`app/Domain` mempertahankan aturan tracking, impor atomik, pembatalan, finance, ticket, assistant agar kontrak tidak berubah.
`SessionState` adalah buffer per-request domain; OperationsSession membaca/menyimpan buffer melalui session Laravel.
Native PHP session dan router standalone tidak digunakan.
`frontend/http.ts` memberi header aplikasi pada semua API fetch. Write ditolak jika origin berbeda,
header aplikasi tidak ada, atau content type tidak valid. API tidak membuka CORS lintas origin.
Blade CSRF default tetap aktif di luar API; API memakai origin/header/content-type boundary.

Cookie HttpOnly/SameSite=Lax, session encryption aktif, session ID dirotasi saat login/logout/aktivasi.
Untuk produksi wajib HTTPS, SESSION_SECURE_COOKIE=true, APP_DEBUG=false, kunci APP_KEY yang privat,
document root backend/public, logging tanpa credential, serta web server produksi (bukan artisan serve).
File .env, .private, backend, credential lokal ditolak Vite dan tidak di-commit.
Logging operasional tetap di root .private/logs; tidak merekam raw body/password/chat/customer details.

## Pemeriksaan

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
Backend: `php artisan test`, `php artisan route:list --path=api`.
Produksi lokal: build dahulu lalu `npm start` (menyalin aset build ke public, Laravel menyajikan SPA).
Daftar endpoint dan kontrak sebelumnya dipertahankan, termasuk upload foto tiket dan export frontend.
Token session versi PHP tidak dibawa ke Laravel: login sekali lagi di salinan baru.
