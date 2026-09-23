# 300 resi tambahan untuk mencoba tracking

Jalankan `supabase/seed-demo-shipments.sql` pada database **development/demo** setelah akun demo dari `supabase/seed.sql` tersedia. Skrip ini menambahkan `ANT-200001` sampai `ANT-200300` tanpa menghapus kiriman yang sudah ada. Semua resi tambahan memakai **kode akses `260926`**. Nama, nomor telepon, alamat, dan perjalanan di dalamnya fiktif; jangan dianggap data pengiriman Anteraja sungguhan.

Contoh yang mudah dicoba di `/lacak`:

| Resi | Rute | Skenario awal |
| --- | --- | --- |
| `ANT-200001` | Jakarta → Bandung | Alamat perlu diperjelas; tindakan penerima tersedia |
| `ANT-200002` | Bandung → Jakarta Selatan | Penerima belum ditemui; perlu tindakan |
| `ANT-200003` | Jakarta → Tangerang Selatan | Dalam perjalanan, pemindaian tertunda |
| `ANT-200004` | Semarang → Surabaya | Sudah dijemput, pemindaian tertunda |
| `ANT-200005` | Surabaya → Malang | Pengantaran berisiko terlambat |
| `ANT-200006` | Bandung → Depok | Dalam perjalanan, sesuai jadwal |
| `ANT-200007` | Jakarta → Bekasi | Pesanan baru dibuat |
| `ANT-200008` | Yogyakarta → Semarang | Sedang diantar, sesuai jadwal |
| `ANT-200009` | Bekasi → Jakarta | Paket dikembalikan |
| `ANT-200010` | Semarang → Yogyakarta | Paket sudah diterima |
| `ANT-200013` | Jakarta → Yogyakarta | Perjalanan antarkota melalui Semarang |
| `ANT-200015` | Surabaya → Jakarta | Perjalanan antarkota melalui Semarang |

Pola skenario berulang setiap 10 nomor, sedangkan rute berulang setiap 15 nomor. Jadi `ANT-200101` juga memerlukan tindakan, tetapi nama penerima, layanan, ETA, dan waktunya berbeda. Setiap resi memiliki 1–4 peristiwa perjalanan. Sebanyak 240 kiriman tambahan aktif dan terlihat di `/pengiriman`; 60 lainnya berstatus selesai atau retur dan tetap bisa ditelusuri melalui `/lacak`.

Skrip ini **tidak** mengubah schema, kebijakan RLS, atau data finansial. Menjalankannya lagi tidak menggandakan resi maupun event. Untuk menguji banyak resi publik, ingat batas keamanan tracking: maksimal 10 permintaan per IP per menit. Login seller demo tetap `demo@contoh.test` / `demo12345`.
