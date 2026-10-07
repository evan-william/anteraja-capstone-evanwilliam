# Jalankan dan periksa cache Redis

Proyek memakai Redis untuk daftar kategori Seller (30 detik) dan geometri rute peta (1 jam). Supabase tetap menjadi database utama. Redis tidak menyimpan password, token, sesi login, hasil transaksi, atau respons chatbot.

## Jalankan lokal tanpa Docker

1. Buka terminal pada root proyek.
2. Jalankan `npm run dev`, atau gunakan `run.bat` seperti biasa.

Launcher otomatis menjalankan Memurai dari `.private/redis/runtime/Memurai/memurai.exe` jika port 6379 belum dipakai. Runtime ini mendukung protokol Redis, hanya mendengarkan `127.0.0.1`, memakai batas 64 MB dengan `allkeys-lru`, dan tidak menulis snapshot/AOF. Tidak ada service Windows atau aturan firewall yang dipasang. Launcher tidak mematikan Redis milik proses lain.

Untuk menjalankan cache secara terpisah:

```powershell
node tools/redis-local.mjs
```

Tekan Ctrl+C untuk menutup proses cache yang dijalankan perintah tersebut.

Runtime lokal tidak masuk Git. Pada komputer lain, ambil Memurai dari situs resminya, atau gunakan Redis yang sudah tersedia. Memurai Developer hanya untuk pengembangan/pengujian dan berhenti otomatis setelah 10 hari; jangan pakai edisi ini untuk produksi.

Untuk menyiapkan runtime yang sama pada Windows dari root proyek, jalankan `powershell -File tools/setup-redis.ps1`. Skrip mengambil paket lewat tautan resmi, memverifikasi tanda tangan Janea Systems, lalu mengekstraknya ke folder privat proyek. Skrip tidak memasang service atau mengubah firewall. Internet diperlukan pada langkah ini saja; runtime yang sudah tersedia tidak diunduh ulang.

## Periksa koneksi

Dari root proyek, jalankan:

```powershell
cd backend
C:\xampp\php\php.exe artisan operations:cache-check
```

Perintah memeriksa PING, penyimpanan, pembacaan, dan penghapusan satu key diagnostik ber-TTL 10 detik. Perintah tidak menampilkan password, tidak membaca data pelanggan, dan tidak menjalankan FLUSHALL/FLUSHDB.

## Konfigurasi

Simpan konfigurasi privat di `backend/.env`:

```dotenv
CACHE_STORE=file
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_CACHE_DB=1
REDIS_CACHE_TIMEOUT=0.1
OPERATIONS_REDIS_ENABLED=true
```

Cache aplikasi memakai store Redis secara eksplisit. Store default tetap file agar sesi dan komponen lain tidak bergantung pada Redis. Predis terpasang lewat Composer; tidak perlu ekstensi PHP Redis. Restart backend setelah mengubah `.env`. Jika konfigurasi pernah di-cache, jalankan `php artisan config:clear`.

Untuk menonaktifkan optimasi, atur `OPERATIONS_REDIS_ENABLED=false`. Untuk mencegah launcher membuka Redis lokal, atur environment PowerShell `$env:LOCAL_REDIS='0'` sebelum menjalankan aplikasi.

## Data dan invalidasi

| Data | TTL | Pengamanan |
| --- | --- | --- |
| Daftar kategori | 30 detik | Login dan role Seller dicek sebelum cache; key memuat hash akun, query, dan generasi. Hanya respons berhasil disimpan. |
| Rute jalan | 3600 detik | Key berdasarkan penyedia dan koordinat; geometri publik saja. Cache file tetap menjadi fallback. |

Create, edit, archive, dan delete kategori mengganti generasi akun setelah database berhasil menyimpan perubahan. Key dari generasi sebelumnya kedaluwarsa sendiri. Generasi disimpan pada store file terpisah agar perubahan saat Redis mati tidak menghidupkan kembali cache lama setelah Redis pulih. Hilangnya metadata generasi menghasilkan generasi baru, bukan menggunakan key lama. Request baca yang sedang berjalan tetap menulis ke generasi yang ia baca sebelumnya.

Perubahan langsung lewat SQL/Supabase di luar aplikasi terlihat paling lambat setelah TTL 30 detik. Validasi kategori saat membuat transaksi tetap membaca database; cache tidak memutuskan apakah transaksi boleh disimpan.

Implementasi generasi file ini ditujukan untuk backend lokal/satu instance. Sebelum deploy ke beberapa instance, gunakan metadata invalidasi bersama yang konsisten; jangan menjalankan setiap instance dengan direktori generasi terpisah. Jika penyimpanan generasi tidak bisa dibaca, aplikasi melewati cache kategori. Jika invalidasi tidak bisa ditulis, request mutasi dapat mengembalikan error setelah database berhasil menyimpan; periksa database sebelum mencoba ulang dan perbaiki permission storage. Tidak ada jaminan seluruh request selesai di bawah satu detik.

## Saat Redis tidak tersedia

Koneksi cache memiliki connect/read timeout 100 ms. Setelah satu kegagalan, request yang sama tidak mencoba Redis lagi. Kategori dibaca langsung dari Supabase; peta memakai cache file atau meminta geometri dari penyedia. Kesalahan upstream tidak disimpan di cache.

Log operasi mencatat `cache.hit`, `cache.miss`, `cache.stored`, dan `cache.unavailable`, tanpa isi cache atau credential. Periksa `.private/logs` untuk menghubungkan kejadian cache dengan request ID dan panggilan Supabase.

Untuk melihat penghematan pembacaan database, login sebagai Seller, buka Kategori, lalu muat ulang dalam 30 detik. Request kedua tetap memeriksa login/role, tetapi cache hit menggantikan SELECT daftar kategori. Edit satu kategori; pembacaan berikutnya harus mengambil data baru.

## Referensi

- [Redis pada Laravel 12](https://github.com/laravel/docs/blob/12.x/redis.md)
- [Memurai Developer dan batas lisensinya](https://www.memurai.com/get-memurai)

Schema database, Supabase RLS, kontrak API, dan frontend tidak diubah untuk cache ini.

## Hasil verifikasi 5 Oktober 2026

- Redis nyata: PING, SET, GET, DELETE lulus melalui `operations:cache-check`.
- Integrasi Seller: dua request kategori menghasilkan data identik; log request kedua berisi `cache.hit` tanpa SELECT kategori ke Supabase.
- Akses anonim tetap 401 saat cache terisi.
- Redis lokal dihentikan sementara: login Seller dan pembacaan kategori tetap berhasil melalui Supabase; log mencatat `cache.unavailable`.
- PHPUnit: 22 test / 88 assertion lulus; termasuk TTL, pemisahan akun/query, invalidasi, Redis outage/recovery, disabled cache, dan generation-store unavailable.
- Frontend: lint lulus, 59 unit test lulus, typecheck dan production build lulus. Build menampilkan dua peringatan annotation Zod yang sudah ada sebelumnya.
- Browser: tracking valid/invalid, login tiga role, halaman Admin/Seller, assistant, Finance, preview impor CSV, kategori, dan penolakan akses lintas role lulus.

Ulangi pemeriksaan integrasi saat aplikasi berjalan menggunakan `node tools/qa-redis-cache.mjs`. Script membaca credential demo dari file privat lokal, tidak mencetaknya, tidak mengubah kategori, lalu logout. Gunakan `QA_BASE_URL` jika port aplikasi bukan 3000. Bukti invalidasi/TTL menggunakan test otomatis; bukan mengubah kategori akun demo di database nyata.
