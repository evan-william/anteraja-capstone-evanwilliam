# Menjalankan versi PHP

Panduan ini untuk menjalankan salinan `Final Project Full - PHP` di Windows. PHP menangani API, sedangkan React + Vite menangani halaman. Database menggunakan proyek Supabase yang sama; jangan jalankan `db reset` pada database tersebut.

## Persiapan

Pastikan Node.js 22+, npm, dan PHP 8.2+ tersedia. PHP harus mengaktifkan `curl`, `mbstring`, `openssl`, dan `fileinfo`. Untuk foto bukti, `upload_max_filesize` harus sedikitnya 2 MB dan `post_max_size` sedikitnya 3 MB. Skrip memilih `C:\xampp\php\php.exe` bila ada; untuk instalasi lain, isi variabel lingkungan `PHP_BIN` dengan path PHP.

Di PowerShell, periksa runtime:

```powershell
node --version
& 'C:\xampp\php\php.exe' -m
```

## Jalankan saat mengembangkan

Di folder proyek ini, siapkan konfigurasi lalu mulai dua proses melalui satu perintah:

```powershell
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Isi `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` di `.env.local` sebelum menjalankan aplikasi. Kunci Gemini opsional; tanpa kunci, asisten Admin tetap menjawab dari data langsung. Buka `http://127.0.0.1:3000/lacak`. Skrip menjalankan PHP pada port 8089 dan Vite pada port 3000; Vite meneruskan `/api/*` ke PHP.

Jika `.env.local` sudah ada dari salinan awal, perintah di atas tidak akan menimpanya. PHP juga menerima nama lama `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Jalankan build produksi lokal

Setelah konfigurasi tersedia, build frontend lalu layani HTML, aset, dan API dari satu server PHP:

```powershell
npm run build
npm run start
```

Buka `http://127.0.0.1:3000/lacak`. `npm run start` menggunakan PHP pada port 3000 dan tidak menjalankan server Next.js. Perintah ini untuk demo lokal, bukan konfigurasi hosting publik. Untuk produksi sesungguhnya, gunakan web server yang memaksa HTTPS, mengelola sesi dengan aman, dan mengirim request `/api/*` ke PHP.

## Periksa fungsi dasar

Di terminal lain, panggil endpoint kesehatan dan jalankan pemeriksaan statis:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
npm run typecheck
npm run lint
npm test
```

Endpoint kesehatan harus mengembalikan `runtime: php`. Untuk tracking demo, buka `/lacak`, masukkan `ANT-100015` dan kode `260926`. Akun tiga role yang sudah tersedia tetap memakai kredensial Supabase sebelumnya; jangan menulis password ke repository.

Untuk uji browser otomatis, jalankan `npm run test:e2e` saat server pengembangan hidup. Tanpa variabel `QA_ADMIN_EMAIL`/`QA_ADMIN_PASSWORD`, `QA_SELLER_EMAIL`/`QA_SELLER_PASSWORD`, dan `QA_CONSUMER_EMAIL`/`QA_CONSUMER_PASSWORD`, skrip hanya menguji tracking publik dan melewati pengujian role tersebut.

## Struktur dan batas data

`frontend/` berisi route dan state React. `components/` berisi komponen UI; `frontend/globals.css` menyimpan styling bersama. `server/router.php` membagi route API; `server/src/` memuat autentikasi, tracking, Finance, impor CSV, tiket, peta, dan asisten. `supabase/migrations/` adalah migrasi database yang sudah ada dan tidak diubah dalam refaktor ini. Sumber Next.js lama tidak ada lagi di salinan PHP.

Browser tidak menerima kunci Gemini. PHP memakai publishable key Supabase dan JWT per sesi, sehingga RLS database tetap menentukan baris yang dapat dibaca atau diubah. File CSV maksimal 10 MB atau 50.000 baris; parser dan pencocokan sekarang berjalan di PHP. Upload ditolak jika format tidak dikenal.

Laporan CS mendukung foto bukti opsional JPG/PNG maksimal 2 MB. Foto disimpan di `.private/ticket-proofs/` dan hanya dapat diunduh Admin melalui API setelah autentikasi. Launcher membuat `.private/php-uploads/` sebagai direktori sementara agar upload PHP menghasilkan JSON bersih. Folder `.private/` harus ikut backup aplikasi dan tidak boleh dipublikasikan. Jalankan `& 'C:\xampp\php\php.exe' server/tests/shipment-status.php` untuk memeriksa aturan ETA dan pesan kendala. Pemetaan lengkap dari panduan mentor ada di [docs/PHP_MENTOR_GUIDE.md](docs/PHP_MENTOR_GUIDE.md).

## Jika halaman tidak memuat data

Jika login gagal atau data kosong secara tidak terduga, periksa `.env.local`, koneksi internet server PHP, dan status Supabase. Jika peta tidak bisa menggambar rute jalan, titik kota tetap ditampilkan; layanan OSRM demo dapat sewaktu-waktu tidak tersedia.

Setelah aplikasi berjalan, baca [README.md](README.md) untuk peta route dan [database/DATABASE_RUN.md](database/DATABASE_RUN.md) untuk konfigurasi database.
