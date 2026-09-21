# FRD-06 — Rekonsiliasi Mutasi dan Settlement Pengiriman

## 1. Tujuan

Fitur ini menerima mutasi bank, mengenali formatnya, menampilkan hasil pencocokan, lalu menyimpan transaksi baru dan menautkan transaksi lama. Pada Anteraja Finance, deskripsi dan referensi pengiriman ditampilkan sebagai konteks agar tim finance dapat menelusuri settlement COD, ongkir, retur, dan biaya layanan.

## 2. User story

Sebagai finance operations, saya ingin mengunggah mutasi rekening settlement dan melihat baris yang sudah cocok, baru, atau bermasalah supaya saya dapat menyelesaikan rekonsiliasi tanpa membuat transaksi ganda.

Sebagai seller administrator, saya ingin melihat referensi nomor resi pada hasil rekonsiliasi supaya dana dapat ditelusuri kembali ke pengiriman terkait.

## 3. Alur utama

1. Pengguna membuka menu **Rekonsiliasi**.
2. Pengguna memilih CSV Bank A atau Bank B.
3. Sistem memvalidasi ukuran dan jumlah baris, lalu mengenali bank dari header/isi.
4. Sistem mem-parsing file tanpa membekukan halaman.
5. Sistem memberi setiap baris status **Baru**, **Cocok**, atau **Error**.
6. Pengguna memilih kategori untuk setiap baris Baru dan dapat menyimpan aturan kata kunci.
7. Pengguna menekan **Simpan hasil rekonsiliasi**.
8. Sistem menyimpan baris Baru, menautkan baris Cocok, dan mencatat ringkasan import dalam satu transaksi database.
9. Riwayat menampilkan hasil. Pengguna dapat membatalkan import yang selesai.

## 4. Functional requirements

| ID | Kebutuhan | Kriteria terima |
|---|---|---|
| FR-06-01 | Unggah CSV Bank A atau Bank B | Kedua file contoh dapat dipilih; tipe selain CSV dan ukuran di atas 10 MB ditolak dengan pesan pemulihan |
| FR-06-02 | Deteksi format dari isi file | Nama file tidak menjadi sumber deteksi; header/kolom menentukan adapter |
| FR-06-03 | Parsing responsif | 50.000 baris selesai tanpa error UI dan tanpa membuat interaksi utama macet |
| FR-06-04 | Preview per baris | Tanggal, keterangan, nominal, status, dan error tampil sebelum penyimpanan |
| FR-06-05 | Kategori baris Baru | Tombol simpan tidak berjalan bila ada baris Baru tanpa kategori; fokus diarahkan ke bagian yang perlu diperbaiki |
| FR-06-06 | Aturan kata kunci | Pengguna dapat memilih pembuatan aturan; kata kunci minimal 2 karakter dan berlaku pada import berikutnya |
| FR-06-07 | Simpan atomik | Baris Baru dibuat, baris Cocok ditautkan, Error diabaikan; kegagalan membatalkan seluruh perubahan proses tersebut |
| FR-06-08 | Riwayat dan batal | Riwayat memuat waktu, file, bank, jumlah tiap status, status proses, dan tombol **Batalkan impor** |
| FR-06-09 | Konteks shipment | Bila referensi resi tersedia dari deskripsi atau sumber settlement, UI menampilkannya tanpa mengubah aturan matching finansial FRD-06 |
| FR-06-10 | Rincian settlement | Rancangan menampilkan resi, status pengiriman, nilai COD, biaya, settlement bersih, dan mutasi terkait sebagai satu jejak audit |

## 5. Aturan bisnis

- Nominal disimpan sebagai integer rupiah positif; jenis pemasukan/pengeluaran berasal dari kategori.
- Baris Cocok tidak dibuat ulang. Sistem menautkannya ke catatan import.
- Baris Error tidak disimpan sebagai transaksi.
- Fingerprint dibentuk dari data mutasi yang sudah dinormalisasi untuk mencegah duplikasi.
- Pembatalan hanya melakukan soft-delete pada transaksi Baru yang dibuat oleh import tersebut.
- Pembatalan tidak menghapus transaksi manual yang berstatus Cocok.
- Referensi shipment bersifat konteks; ketiadaannya tidak menggagalkan rekonsiliasi mutasi.

## 6. Keadaan antarmuka

| Keadaan | Tampilan | Pemulihan |
|---|---|---|
| Awal/kosong | Area unggah dan batas file | Pilih file CSV |
| Memproses | Label tetap “Memproses file…” dan kontrol unggah nonaktif | Tunggu hingga preview muncul |
| Preview campuran | Ringkasan Baru/Cocok/Error dan tabel | Isi kategori yang belum lengkap |
| Validasi gagal | Pesan menyebut baris/penyebab | Kembali ke baris bermasalah tanpa kehilangan pilihan lain |
| Simpan gagal | Alert di atas preview | Coba lagi; data preview tetap ada |
| Simpan berhasil | Konfirmasi dan riwayat diperbarui | Mulai rekonsiliasi berikutnya |
| Riwayat kosong | Penjelasan singkat | Unggah mutasi pertama |
| Pembatalan | Konfirmasi menyebut konsekuensi | Batal menutup dialog; konfirmasi menjalankan soft-delete |
| Mobile | Tabel dapat digulir horizontal, aksi utama tetap terbaca | Tidak ada konten terpotong |

## 7. Data dan integrasi

Implementasi memakai tabel `bank_imports`, `bank_import_rows`, `category_rules`, dan `transactions`. Supabase menangani autentikasi, Row Level Security, dan transaksi penyimpanan. PapaParse menangani CSV. Nomor resi pada desain Day 5 adalah atribut tampilan/proposal integrasi; pengambilan status shipment langsung tetap di luar lingkup.

## 8. Peran MCP dalam verifikasi

| MCP | Pemakaian | Bukti di repositori |
|---|---|---|
| Context7 | Memeriksa dokumentasi PapaParse dan pola parsing CSV | `bukti/frd-06/context7-*.json` |
| Supabase | Memeriksa skema, security advisor, dan data sebelum/sesudah/batal | `bukti/frd-06/supabase-*.json` |
| Chrome DevTools | Mengukur proses 50.000 baris dan memeriksa error browser | `bukti/frd-06/performance-50000.*` |

## 9. Acceptance checklist

- [x] File contoh Bank A dan Bank B didukung.
- [x] Format dikenali dari isi.
- [x] Preview memakai Baru, Cocok, dan Error.
- [x] Baris Baru membutuhkan kategori.
- [x] Aturan kata kunci tersedia.
- [x] Penyimpanan dan penautan dilakukan atomik.
- [x] Riwayat dan pembatalan aman tersedia.
- [x] Unit test, typecheck, lint, dan production build lulus pada baseline FRD-06.
- [x] Desain Day 5 mencakup ringkasan, unggah, preview, riwayat, rincian shipment, dan mobile.
