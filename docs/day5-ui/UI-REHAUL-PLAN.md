# UI Rehaul Plan — Anteraja Finance

## Tujuan

Merapikan aplikasi keuangan operasional Anteraja tanpa mengubah kontrak FRD-06. Pengguna tetap dapat mencatat transaksi, mengelola kategori, mengunggah mutasi, meninjau hasil pencocokan, menyimpan rekonsiliasi, dan membatalkan impor dengan aman.

## Arah produk

- Antarmuka dibuat untuk pekerjaan finance operations: padat, tenang, dan mudah dipindai.
- Magenta Anteraja menandai aksi utama dan posisi aktif. Warna status tetap memiliki arti sendiri.
- Nomor resi dan settlement diposisikan sebagai konteks operasional, bukan fitur tracking yang pura-pura sudah terhubung.
- Satu aksi utama ditonjolkan pada setiap layar. Aksi sekunder tetap netral.
- Tabel dipakai untuk data yang perlu dibandingkan. Panel hanya dipakai saat benar-benar membentuk satu kelompok kerja.

## Perubahan

1. Mengganti identitas sementara dengan logo Anteraja pada header dan autentikasi.
2. Menambah navigasi aktif dan navigasi mobile yang dapat diakses keyboard.
3. Menyatukan page header, permukaan, input, tombol, status, dan ritme tipografi.
4. Mengubah daftar transaksi dan kategori menjadi baris data yang lebih rapat.
5. Memperjelas alur rekonsiliasi menjadi unggah, tinjau, lalu simpan.
6. Memperbaiki microcopy untuk loading, error, empty state, dan tindakan berisiko.
7. Menambah motion berbasis `transform` dan `opacity` dengan durasi 120–360 ms.
8. Menonaktifkan motion non-esensial melalui `prefers-reduced-motion`.

## Kontrak yang dipertahankan

- CSV Bank A dan Bank B, maksimum 10 MB atau 50.000 baris.
- Status `Baru`, `Cocok`, dan `Error` tetap memiliki arti yang sama.
- Baris baru wajib memiliki kategori sebelum penyimpanan.
- Penyimpanan tetap atomik.
- Pembatalan hanya menghapus transaksi yang dibuat oleh impor terkait.
- Batas halaman preview tetap 100 baris.
- Validasi, API, Supabase RLS, dan skema database tidak diubah.

## Verifikasi

- TypeScript, ESLint, unit test, dan production build lulus.
- Layar preview diperiksa pada desktop dan mobile.
- Fokus keyboard, nama kontrol, kontras, overflow tabel, dan reduced motion diperiksa.
- Tidak ada error browser pada alur preview.
