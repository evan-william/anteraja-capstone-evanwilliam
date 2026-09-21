# Catatan keputusan produk Day 5

## Brief internal

- **Pengguna:** finance operations dan seller administrator.
- **Pekerjaan utama:** memastikan dana settlement sesuai dengan pengiriman dan mutasi rekening.
- **Perilaku saat ini:** memeriksa spreadsheet, mutasi bank, dan data pengiriman secara terpisah.
- **Hasil yang diinginkan:** satu alur yang dapat ditinjau dan diaudit sebelum data keuangan disimpan.
- **Keberhasilan:** tidak ada duplikasi, semua baris memiliki status, pembatalan tidak merusak transaksi lama, dan layar tetap dapat digunakan pada mobile.
- **Non-goal:** bukan aplikasi tracking konsumen dan bukan koneksi bank langsung.
- **Objek utama:** import, baris mutasi, transaksi, kategori, aturan kata kunci, dan referensi shipment.
- **Konsekuensi utama:** simpan membuat/menautkan transaksi; batal hanya menghapus secara lunak transaksi yang dibuat oleh import.
- **Reversibilitas:** preview bebas diubah; simpan dapat dibatalkan melalui riwayat; transaksi manual yang cocok tidak ikut dibatalkan.
- **Hak akses:** semua data dibatasi per pengguna melalui autentikasi dan RLS.

## Keputusan terbuka

1. Sumber resmi nomor resi dan status shipment belum ditetapkan. Adapter baru hanya boleh dibuat setelah kontrak API tersedia.
2. Matching shipment belum mengubah algoritma pencocokan finansial. Bila referensi tidak tersedia, rekonsiliasi tetap dapat selesai.
3. Rincian shipment pada Day 5 adalah rancangan antarmuka untuk arah produk berikutnya, bukan klaim bahwa integrasi API telah aktif.
