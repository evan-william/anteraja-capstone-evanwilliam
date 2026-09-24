# Naskah rekaman Day 8 (target 4 menit 30 detik)

Rekam layar aplikasi dan suara. Resolusi 1080p cukup. Tutup tab yang menampilkan token, `.env.local`, password, atau data pribadi. Jalankan aplikasi Full dengan `npm run dev` dari root repository; gunakan project Supabase demo yang sudah tersambung. Jangan membuat tiket sungguhan berulang kali saat latihan rekaman.

| Waktu | Tunjukkan di layar | Ucapan singkat |
|---|---|---|
| 0:00-0:25 | Halaman `/lacak`, lalu branch `7-prototype` di GitHub | “Ini prototype Anteraja di branch 7-prototype. Tugas hari ini menunjukkan interaksi JavaScript yang membantu pengguna menyelesaikan alur.” |
| 0:25-1:05 | Form resi: coba format salah, lalu `ANT-100015` + `260926` | “Saat input berubah, kode akses dibatasi enam angka. Saat submit, fungsi memvalidasi format. Yang salah memberi pesan; yang benar membuka detail kiriman.” |
| 1:05-1:45 | Detail: status/ETA, tombol **Tangani sekarang**, timeline, buka-tutup peta | “Kondisi status menentukan apakah tombol tindakan tampil. Tombol membawa fokus ke form. Peta baru dimuat saat saya buka; timeline tetap bisa dipakai bila peta gagal.” |
| 1:45-2:15 | Halaman `/masuk`: ganti slide manual dan jeda carousel, lalu login dengan akun demo | “Carousel memakai timer dan event klik, hover, serta fokus. Saat login, tombol berubah menjadi ‘Memeriksa akun’; setelah berhasil, halaman mengikuti role akun.” |
| 2:15-3:05 | Ruang Seller: filter/cari kiriman, buka detail, tunjukkan form tiket tanpa perlu kirim bila tiket demo sudah ada | “Filter dan pencarian langsung mengubah daftar. Form tiket menahan submit ganda dan memberikan status sukses atau error. Resi dan riwayat paket ikut terlampir.” |
| 3:05-4:05 | Ruang Admin: tiket masuk, buka asisten, tanya “tiket baru”, tampilkan opsi dan konfirmasi sebelum aksi | “Admin melihat tiket dari Seller atau Konsumen. Asisten membaca konteks operasional dan meminta konfirmasi sebelum mengubah status tiket.” |
| 4:05-4:30 | Kembali ke README Day 8 atau commit log | “Tujuh interaksi ini tercatat dalam tujuh commit berbeda. Event, kondisi, fungsi, dan pembaruan DOM dijelaskan pada dokumentasi Day 8.” |

## Supaya rekaman aman dan jelas

1. Siapkan satu tab publik `/lacak`, satu akun Seller demo, dan satu akun Admin demo. Gunakan profil browser terpisah atau login-logout agar role tidak tercampur.
2. Rekam maksimal lima menit. Saat memasukkan password, jeda perekaman atau tutupi area input. Jangan tampilkan kode aktivasi Admin atau API key.
3. Setelah rekaman selesai, unggah MP4 ke Google Drive milikmu.
4. Di Drive, buka **Bagikan**, tambahkan `product.maxyacademy@gmail.com` dan `huda.maxy.academy@gmail.com`, pilih **Editor**, lalu kirim.
5. Salin tautan video. Pastikan kedua email dapat membuka file sebelum menaruh tautannya di LMS.

Jika waktu mepet, prioritaskan lima alur: tracking validasi, tindakan status, login pending, tiket Seller, dan asisten Admin. Jangan mengaku sudah melakukan aksi yang tidak terekam.
