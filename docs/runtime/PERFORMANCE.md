# Optimasi Laravel — 1 Oktober 2026

## Perubahan

- Transport Supabase menggunakan kembali koneksi HTTPS selama satu request Laravel. `curl_reset` membersihkan opsi/header/body sebelum panggilan berikutnya; middleware melepas handle pada `finally`. Kredensial dan koneksi tidak dibagikan antarpengguna.
- Respons Supabase mendukung kompresi. HEAD tidak menunggu body; HTTPS dan verifikasi TLS tetap wajib. Timeout tetap terbatas, tanpa retry otomatis untuk operasi tulis.
- Daftar admin meminta baris dan `count=exact` sekaligus. Sebelumnya ada HEAD tambahan. Filter, pagination, total tepat, dan RLS tetap digunakan.
- Geometri jalan publik disimpan selama satu jam berdasarkan provider dan koordinat. Respons gagal tidak disimpan; cache gagal tidak menghalangi pengambilan rute. Data paket dan akun tidak masuk cache ini.
- Pembacaan profil/role gagal tertutup saat transport gagal atau respons tidak valid. Autentikasi dan role tetap diperiksa langsung pada setiap request.
- Hasil fetch React yang sudah dibatalkan tidak boleh menimpa state baru.

## Pengukuran nyata

Jalankan dari root proyek:

```powershell
$env:QA_BASE_URL='http://127.0.0.1:3002'; node tools/benchmark-laravel.mjs
```

Script membaca akun demo lokal tanpa mencetak kredensial. Hasil tersimpan di `output/laravel-qa/performance.json`. Menguji tiga role, logout, penolakan lintas role, kode tracking tidak valid, total pagination, dan waktu respons. Pengukuran ini bukan load test produksi.

Sampel pertama setelah optimasi, melalui Vite + Laravel + Supabase asli:

| Endpoint | Waktu yang terukur |
| --- | --- |
| Tracking, dua request setelah pertama | 407–459 ms |
| Daftar admin, dua request setelah pertama | 479–490 ms |
| Dashboard Seller, tiga request | 526–610 ms |
| Paket Konsumen, tiga request | 448–485 ms |
| Login ketiga role | 478–949 ms |
| Peta dari cache server | 138 ms |

Request pertama tracking 1.074 ms dan daftar admin 1.523 ms. **Tidak seluruh request memenuhi target kurang dari satu detik.** Tidak ada baseline terkontrol sebelum perubahan, sehingga angka ini tidak menyatakan persentase percepatan. Koneksi dingin, latensi internet, Supabase, OSRM, dan Gemini tetap memengaruhi hasil. Generasi jawaban Gemini tidak mempunyai jaminan satu detik dan tidak diganti dengan jawaban palsu demi mengejar angka.

Pengukuran ulang setelah dukungan kompresi dan HEAD: tracking 391–528 ms, daftar admin 453–544 ms, dashboard Seller 488–507 ms, login 527–701 ms, dan peta yang sudah tersimpan 117–131 ms. Hasil JSON menyimpan pengukuran ulang terakhir, bukan sampel pertama pada tabel. Angka satu sesi tidak membuktikan SLA/p95 produksi.

## Database dan deployment

Tidak mengubah schema, seed, RLS, maupun database Supabase remote. Migration yang ada sudah mencakup indeks timeline `(shipment_id, occurred_at)`, tiket `(shipment_id, created_at)`, risiko Seller `(user_id, risk_status, estimated_delivery_at)`, transaksi per akun/tanggal, dan riwayat impor per akun. Audit ini membaca definisi migration, bukan EXPLAIN pada database produksi. Mengurangi round-trip adalah optimasi yang diterapkan; tidak menambah indeks secara spekulatif tanpa query plan dan ukuran data nyata.

Untuk produksi, gunakan PHP-FPM dengan beberapa worker, OPcache, HTTPS, dan deploy dekat region Supabase. `artisan serve` di Windows adalah server demo satu proses: request Gemini yang lama dapat menahan request lain dalam antrean. Jangan menilai kemampuan konkurensi produksi dari server ini. Gunakan `php artisan config:cache` dan `php artisan route:cache` saat deployment setelah environment benar; bersihkan cache konfigurasi ketika environment berubah. Jangan menaruh key Supabase/Gemini di frontend.

## Verifikasi

- TypeScript check dan ESLint lulus.
- Vitest: 59 tes lulus; termasuk bootstrap halaman, deduplikasi request berjalan, pembatalan, dan isolasi perubahan akun.
- PHPUnit: 18 tes, 77 assertions lulus; termasuk pelepasan koneksi, reset handle, parsing total kosong/terisi, cache geometri, dan pembatasan bootstrap.
- Production build lulus; ada dua warning annotation dari dependensi Zod, bukan error build.
- Smoke browser lulus: tracking valid/tidak valid, login tiga role, detail kiriman, tiket, jawaban asisten, Finance, kategori, preview CSV, serta penolakan role yang tidak berhak.
- `git diff --check` lulus.

Tes tidak mencakup semua kemungkinan gangguan jaringan, beban besar, pencabutan role saat request berjalan, atau seluruh mutasi produksi. Tidak melakukan reset database, registrasi massal, atau operasi destruktif saat QA. Belum push/commit perubahan optimasi ini.

## Total alur API halaman — 1 Oktober 2026

**Target seluruh alur di bawah satu detik belum terpenuhi pada semua sampel.** Angka per-endpoint di atas bukan bukti bahwa seluruh halaman selesai mengambil data dalam satu detik.

Pengukuran terbaru menghitung rentang dari request API pertama sampai respons API terakhir selesai di browser, untuk pembukaan dashboard dengan sesi yang sudah login. Rentang ini mencakup antrean dan transfer respons. Login sebelumnya, unduhan aset, render halaman, Gemini, dan operasi lain tidak termasuk dalam angka API ini; waktu sampai data halaman tampil dicatat terpisah.

| Role | Total alur API, tiga sampel (ms) |
| --- | --- |
| Admin | 927 / 1.266 / 769 |
| Seller | 967 / 720 / 736 |
| Konsumen | 1.056 / 931 / 1.032 |

Enam dari sembilan sampel di bawah 1.000 ms; tiga melampaui target. Waktu halaman termasuk aset dan render adalah 1.516–2.110 ms. Hasil mentah: `output/laravel-qa/page-flow-after.json`. Ini sampel lokal, bukan SLA atau p95 produksi.

### Perubahan pada jalur kritis

- Browser memakai satu `GET /api/v1/bootstrap` untuk identitas akun dan data awal halaman, menggantikan empat request pada pengukuran awal. Endpoint lama tetap tersedia. Bootstrap hanya menerima maksimal dua resource GET yang masuk whitelist; setiap resource mempertahankan pemeriksaan role, RLS, dan envelope hasilnya.
- Payload awal dikonsumsi sekali, bukan disimpan sebagai cache data permanen. Request GET yang sedang berjalan dibagikan antar subscriber; hasil selesai tidak disimpan. Perubahan akun membatalkan request lama. Mutasi tidak masuk deduplikasi ini.
- Detail kiriman mengambil timeline, instruksi, dan tiket secara paralel setelah otorisasi kiriman. Profil dan role tetap dibaca berurutan: percobaan memparalelkan autentikasi menimbulkan kegagalan dan sudah dibatalkan.
- cURL menggunakan ulang koneksi HTTPS dalam satu request, dengan berbagi DNS, sesi TLS, dan koneksi. Handle dilepas setelah request; kredensial tidak dibagikan antar akun/request.
- Launcher proyek mengaktifkan OPcache jika ekstensi lokal tersedia. OPcache menyimpan kode PHP yang sudah dikompilasi, bukan data akun. Pemeriksaan perubahan file tetap aktif agar edit lokal langsung berlaku. Tidak mengubah `php.ini` global.

### Mengulang pengukuran

Jalankan build, lalu server demo hasil build dari root proyek:

```powershell
npm run build
$env:PORT='3063'; npm start
```

Di terminal kedua pada root yang sama:

```powershell
$env:QA_BASE_URL='http://127.0.0.1:3063'; $env:QA_PHASE='after'; node tools/benchmark-page-flow.mjs
```

Jangan menjalankan QA lain bersamaan karena server PHP lokal Windows melayani request secara berurutan. Baseline lama memakai dev server, sedangkan hasil terbaru memakai build dan OPcache; jangan menghitung persentase percepatan dari dua lingkungan berbeda tersebut.

### Batas target

Asynchronous/paralel mengurangi waktu tunggu independen, tetapi tidak menghapus latensi jaringan, pekerjaan yang harus berurutan, atau antrean server satu proses. Tidak menetapkan timeout satu detik atau mengembalikan data parsial sebagai sukses untuk mengejar angka. Tidak mengubah schema, seed, RLS, kontrak endpoint lama, maupun aturan bisnis.

Untuk melanjutkan target terukur diperlukan server produksi multi-worker dekat region Supabase, pengukuran beban/latensi, lalu optimasi query berdasarkan query plan nyata. Respons final Gemini dan semua operasi eksternal tidak bisa dijamin selesai satu detik oleh kode lokal saja. Memisahkan pekerjaan panjang menjadi job asynchronous membutuhkan kontrak job/status yang jelas; belum mengubah kontrak chatbot atau mutasi pada optimasi ini.
