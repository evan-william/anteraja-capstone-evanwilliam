# Penerapan panduan PHP pada proyek Anteraja

Proyek ini mengikuti pola inti modul mentor: React + Vite menangani tampilan, sedangkan PHP menerima request, memvalidasi data, membaca/menulis data, dan mengembalikan JSON. Bagian modul untuk **Evan W.** membahas status ETA, pesan kendala, serta laporan CS dengan foto bukti. Implementasi di sini memakai data dan route proyek yang sudah berjalan, bukan data contoh di modul.

## Hubungan contoh modul dengan kode proyek

| Konsep dalam modul | Implementasi di proyek |
| --- | --- |
| `statusKetepatan()` dan `pesanKendala()` | `backend/app/Domain/ShipmentStatus.php` menghitung label, pesan, dan kondisi ETA dari data kiriman. |
| `TiketCS` dan upload foto | `backend/app/Domain/TicketProof.php` memvalidasi JPG/PNG maksimal 2 MB, menyimpan file di `.private/ticket-proofs/`, dan hanya mengizinkan Admin mengunduhnya setelah pemeriksaan akses. |
| Endpoint GET tracking yang mengembalikan JSON | `GET /api/v1/tracking/{resi}?code={kode}` menambahkan objek `timeliness` pada respons yang sudah ada. |
| Endpoint POST laporan | Route tiket Konsumen dan Seller tetap menerima JSON lama; jika ada foto, form mengirim `multipart/form-data`. |
| React `fetch()` dan `FormData` | `frontend/components/tracking/tracking-experience.tsx` dan `frontend/components/tracking/seller-ticket-form.tsx`. |
| Konfigurasi API terpusat | `frontend/api.tsx` dan route `/api/v1/*` yang diproksikan Vite pada saat pengembangan. |
| Database | PostgreSQL Supabase yang sudah digunakan proyek; tidak dibuat database MySQL latihan yang terpisah. |

Modul memakai `php-api/hari1.php`, `php-api/hari2.php`, dan XAMPP Apache untuk menjelaskan konsep. Proyek ini sekarang memakai routing Laravel dan kontrak URL yang digunakan UI serta pengujian. Memindahkan endpoint ke nama file latihan akan memutus alur yang ada. PHP tetap bisa dijalankan dari instalasi XAMPP melalui `C:\xampp\php\php.exe`, melalui Laravel tanpa menjalankan MySQL XAMPP.

Contoh data `AJ001`/`AJ002`, database MySQL `anteraja_training`, dan contoh kunci service-role tidak disalin ke aplikasi. Mereka hanya menjelaskan teknik; menambahkannya akan membuat dua sumber data dan dapat melewati RLS yang sudah ada. Tantangan opsional seperti pengiriman WhatsApp massal, tautan `wa.me`, dan unduhan ringkasan tiket juga tidak diaktifkan tanpa kebijakan pengiriman/notifikasi dan persetujuan penerima yang jelas. Preferensi notifikasi yang sudah ada tetap bekerja seperti sebelumnya.

## Status ETA dan kendala

`ShipmentStatus::describe()` memilih satu keadaan untuk tiap kiriman: sudah diterima, selesai, perlu tindakan, instruksi diterima, lewat estimasi, berisiko terlambat, mendekati estimasi, sesuai estimasi, atau estimasi belum tersedia. Status yang membutuhkan tindakan atau menunggu sinkronisasi kurir diprioritaskan sebelum perhitungan waktu; paket terkirim tidak ditandai terlambat hanya karena ETA-nya sudah lewat. Jika kode kendala tidak dikenal, PHP mengirim pesan umum dan tidak menampilkan kode teknis mentah.

Respons tracking menambahkan `timeliness` tanpa menghapus field lama. Teks itu tampil di ringkasan tracking publik. Fungsi ini memakai `DateTimeImmutable` dan timestamp sehingga perbandingan tetap benar saat ETA memakai zona waktu yang berbeda.

## Foto bukti pada tiket CS

1. Masuk sebagai Konsumen atau Seller, lalu buka formulir laporan pada kiriman yang boleh diakses.
2. Isi catatan. Foto bukti bersifat opsional; pilih JPG atau PNG dengan ukuran paling besar 2 MB.
3. PHP memeriksa hasil upload, ukuran, MIME isi file, dan struktur gambar sebelum membuat tiket.
4. Tiket tetap dibuat oleh RPC PostgreSQL yang lama. Resi, perjalanan, kendala, dan posisi terakhir tetap masuk ke konteks tiket seperti sebelumnya.
5. Jika foto terpilih, PHP menyimpannya di `.private/ticket-proofs/` dengan nama berdasarkan ID tiket yang dibuat database. Admin melihat tautan **Unduh foto bukti** di daftar tiket. Role lain tidak dapat membuka URL unduhan ini.

Jika penyimpanan foto gagal **setelah** database membuat tiket, respons tetap menyatakan tiket berhasil dibuat dan mengirim `proof_warning`. Jangan mengirim tiket kedua karena foto gagal; gunakan nomor tiket yang sudah ditampilkan. File di `.private/ticket-proofs/` adalah bagian data aplikasi dan harus ikut backup server. Penyimpanan lokal ini cocok untuk satu server demo; untuk beberapa server, gunakan penyimpanan bersama dengan kebijakan akses yang setara sebelum deployment.

Jangan menaruh `.private/`, `.env.local`, atau kunci server di folder `public/` maupun di Git. Route foto memeriksa sesi Admin dan keberadaan tiket sebelum membaca file privat. Tidak ada perubahan schema, RLS, atau migrasi database untuk penyesuaian ini.

## Jalankan dan periksa

Dari folder proyek, jalankan:

```powershell
npm run dev
```

Buka `http://127.0.0.1:3000/lacak`. Untuk memeriksa logika status tanpa database:

```powershell
Push-Location backend
& 'C:\xampp\php\php.exe' artisan test --filter=ShipmentStatusTest
Pop-Location
```

Untuk pengujian lengkap, jalankan `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build`. Lihat [LARAVEL_RUN.md](../../LARAVEL_RUN.md) untuk persiapan konfigurasi Supabase dan port.
