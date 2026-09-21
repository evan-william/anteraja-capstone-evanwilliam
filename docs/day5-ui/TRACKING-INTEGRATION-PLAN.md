# Rencana Integrasi Anteraja Tracking

Status: diimplementasikan pada basis kode Day 5.

## Arah produk

Tracking dan penyelesaian kendala kiriman menjadi alur utama. Seller dashboard membantu tim memantau kiriman berisiko, sedangkan Finance/Rekonsiliasi tetap tersedia sebagai modul pendukung untuk menelusuri hubungan resi, COD, settlement, dan mutasi bank.

## Alur utama

1. Penerima memasukkan nomor resi dan kode akses enam digit.
2. Sistem menampilkan status risiko, estimasi, lokasi terakhir, serta timeline terpadu.
3. Jika kiriman bermasalah, penerima dapat memperbarui petunjuk alamat, memilih jadwal ulang/safe drop, atau membuat tiket bantuan.
4. Perubahan masuk ke outbox integrasi agar dapat diteruskan ke sistem kurir, CS, WhatsApp, email, atau push notification.
5. Seller memantau semua kiriman, memfilter tingkat risiko, membuka detail, dan mengekspor CSV/JSON.
6. Tim Finance merekonsiliasi mutasi bank dengan settlement yang tetap terhubung ke resi.

## Batas integrasi

Project demo tidak memakai API produksi Anteraja. Adapter dan integration outbox menyimulasikan kontrak integrasi secara aman, sehingga API asli dapat dipasang tanpa mengubah UI atau model data inti.

## Urutan implementasi

- Migrasi additive untuk events, resolution, ticket, notification preferences, rate limit, dan outbox.
- Public tracking API dan action API dengan validasi, masking PII, kode akses, dan rate limit.
- Public tracking experience dan seller operations dashboard.
- Navigasi terpadu dengan Tracking sebagai produk utama dan Finance sebagai modul pendukung.
- Seed skenario normal, berisiko, dan membutuhkan tindakan.
- Unit test, typecheck, lint, production build, serta pembaruan dokumentasi operasional.

## Definition of done

- Semua requirement utama FRD Tracking dapat didemokan end-to-end.
- FRD-06 Finance/Rekonsiliasi tidak mengalami regresi.
- Database memiliki PK, FK komposit, constraint, index, RLS, fungsi atomik, dan audit timestamps.
- UI responsif, dapat dipakai dengan keyboard, menghormati reduced motion, dan tidak bergantung pada warna saja.
- README dan panduan database cukup untuk menjalankan project dari kondisi kosong.
