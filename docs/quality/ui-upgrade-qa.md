# UI Upgrade dan QA

## Arah visual

Antarmuka memakai magenta Anteraja sebagai penanda aksi utama dan status aktif. Surface utama memakai warm off-white, sedangkan teks dan area gelap memakai neutral hangat. Open Sans tetap menjadi satu-satunya keluarga font. Dashboard mempertahankan kepadatan informasi melalui tabel, pembatas horizontal, angka tabular, dan hierarchy yang ringkas.

## Perubahan utama

- Token warna, type rhythm, spacing, radius, focus ring, dan motion dikonsolidasikan di `app/globals.css`.
- Login dan registrasi mempertahankan layout dua kolom serta tiga slide. Slide fasilitas sortir diganti dengan visual lokal yang lebih terang. Carousel memiliki autoplay, kontrol slide, tombol jeda/putar, pause saat hover atau focus, serta reduced-motion.
- Navigasi menempatkan Pengiriman dan Lacak Paket sebagai tujuan utama. Arus Dana, Rekonsiliasi, dan Kategori dikelompokkan di Finance. Mobile memakai disclosure menu agar item tidak terpotong.
- Form tracking memperjelas perbedaan nomor resi dan kode akses serta menghubungkan pesan error dengan kontrol terkait.
- Dashboard pengiriman mempertahankan tabel sebagai tampilan utama, memperkuat hierarchy metrik, dan memberi empty state yang dapat dipulihkan.
- Rekonsiliasi memakai penanda langkah berbasis teks dan mempertahankan status Baru, Cocok, dan Error dengan label serta indikator non-warna.

## Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| TypeScript | Lulus |
| ESLint sumber aplikasi | Lulus |
| Unit test | 37/37 lulus |
| E2E transaksi dasar | 1/1 lulus |
| E2E impor, rekonsiliasi, dan pembatalan | 1/1 lulus |
| Production build | Lulus |
| Login dan validasi register | Lulus |
| Carousel 3 slide, kontrol manual, pause, reduced-motion | Lulus |
| Tracking valid dan invalid | Lulus |
| Loading skeleton tracking | Lulus |
| Dashboard terisi dan hasil kosong | Lulus |
| Stress test konten panjang | Lulus |
| Export CSV sesuai filter aktif | Lulus |
| Finance dan rekonsiliasi | Lulus |
| Desktop, tablet, dan mobile | Lulus |
| Navigasi keyboard dan focus terlihat | Lulus |
| Simulasi jaringan tracking gagal | Lulus |
| Console browser production | Tidak ada error baru |

Bukti render dan hasil otomatis berada di folder `docs/quality/evidence/`. Pemeriksaan dapat diulang dengan:

```bash
node scripts/qa-ui.mjs
```

## Batas perubahan

Schema PostgreSQL, migration, RLS, Supabase, API, route, autentikasi, validasi, resolution tracking, import dan rekonsiliasi, serta export tidak diubah. Seluruh perubahan pada pekerjaan ini berada di lapisan presentasi, aksesibilitas, motion, aset visual, dan dokumentasi QA.
