# Pemetaan Halaman Prototype ke FRD

Setiap halaman berikut berasal dari kebutuhan PRD dan FRD Anteraja Tracking & Operations. Halaman publik dan halaman setelah login memakai bahasa visual, navigasi, dan pola interaksi yang sama.

## Halaman publik dan autentikasi

| Halaman | Rute | FRD | Implementasi |
|---|---|---|---|
| Tracking awal | `/lacak` | TRK-01, TRK-02 | Form resi dan kode enam digit, penjelasan privasi, validasi format, JSON-LD `WebApplication` |
| Hasil tracking | `/lacak/[awb]` | TRK-03 - TRK-12 | Ringkasan, ETA, risiko, timeline, resolution, notifikasi, dan tiket CS |
| Masuk | `/masuk` | AUTH-01 | Form email/password dengan label, autocomplete, error, dan pending state |
| Daftar | `/daftar` | AUTH-01 | Form nama/email/password, validasi, konfirmasi email, dan pending state |

## Seller operations

| Halaman | Rute | FRD | Implementasi |
|---|---|---|---|
| Control tower | `/pengiriman` | OPS-01 - OPS-03, OPS-05, OPS-06 | Metrik, filter risiko, pencarian, empty state, tabel, ekspor CSV/JSON |
| Detail shipment | `/pengiriman/[awb]` | OPS-04 | Timeline, konteks kendala, ETA, jumlah instruksi, dan tiket CS |

## Finance operations

| Halaman | Rute | FRD | Implementasi |
|---|---|---|---|
| Arus dana | `/transaksi` | FIN-01 | Tambah, ubah, hapus lunak, kelompok tanggal, dan ringkasan transaksi |
| Rekonsiliasi | `/import` | FIN-03 - FIN-10 | Unggah CSV, deteksi bank, preview, kategori, simpan, riwayat, pembatalan |
| Kategori | `/kategori` | FIN-02 | Pengelolaan kategori pemasukan/pengeluaran dan status arsip |

FIN-11 dan FIN-12 muncul lintas halaman melalui hubungan shipment, settlement, dan mutasi. Model data serta relasinya dijelaskan pada dokumentasi database Day 6.

## FR yang dipakai sebagai bukti LMS

Screenshot pengumpulan memakai **TRK-05 - Risiko dan tindakan** pada hasil tracking `ANT-100015`. Tampilan tersebut memperlihatkan:

1. label **Perlu tindakan** yang tidak hanya bergantung pada warna;
2. alasan alamat belum cukup jelas;
3. ringkasan resi, layanan, ETA, penerima, dan posisi terakhir;
4. tombol **Tangani sekarang** yang mengarah ke form resolution;
5. konteks halaman hasil tracking yang berasal dari resi dan kode akses.

FR ini dipilih karena menunjukkan hubungan langsung antara data, UI, navigasi internal halaman, dan tindakan pengguna.

## Keadaan antarmuka

| Alur | Keadaan yang tersedia |
|---|---|
| Autentikasi | default, loading, error, akun dibuat, berhasil masuk |
| Tracking | awal, validasi gagal, loading, tidak ditemukan, ditemukan, rate limit, resolution tersimpan |
| Seller | data terisi, kosong, filter tanpa hasil, error, dan data panjang |
| Rekonsiliasi | awal, membaca file, preview, validasi kategori, simpan, riwayat kosong/terisi, pembatalan |

Loading, error, dan pesan hasil memakai teks yang dapat dibaca screen reader melalui `role="status"`, `role="alert"`, atau `aria-live` pada bagian yang relevan.
