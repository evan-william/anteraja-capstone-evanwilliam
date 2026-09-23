# PRD — Anteraja Tracking & Operations

## Ringkasan produk

Anteraja Tracking & Operations adalah satu produk operasional yang menghubungkan perjalanan paket dengan perjalanan dananya. Tracking menjadi alur utama untuk penerima dan seller. Finance melanjutkan jejak yang sama dari resi, COD, dan biaya hingga settlement serta mutasi bank.

Produk ini membantu pengguna menjawab dua kelompok pertanyaan tanpa berpindah sistem:

1. Di mana paket berada, apakah masih tepat waktu, dan tindakan apa yang diperlukan?
2. Apakah dana pengiriman sudah diterima, nilainya sesuai, dan mutasi banknya sudah cocok?

## Masalah yang diselesaikan

| Tahap | Masalah | Dampak |
|---|---|---|
| Tracking | Status teknis seperti “in transit” tidak menjelaskan kondisi sebenarnya | Penerima tidak tahu apakah paket aman atau terlambat |
| Penanganan kendala | Alamat, jadwal, dan laporan CS berada di alur berbeda | Pengguna mengulang informasi dan penanganan melambat |
| Operasi seller | Risiko tersebar di banyak resi dan spreadsheet | Tim sulit menentukan kiriman yang harus didahulukan |
| Settlement | Resi, COD, potongan, dan pencairan tidak berada dalam satu jejak | Seller sulit memastikan dana setiap pengiriman |
| Rekonsiliasi | Deskripsi mutasi bank tidak seragam | Tim Finance memeriksa data secara manual dan berisiko membuat transaksi ganda |

## Pengguna utama

| Pengguna | Tujuan utama |
|---|---|
| Penerima paket | Mengetahui posisi, estimasi, risiko, dan tindakan yang tersedia |
| Seller administrator | Memantau kiriman, memprioritaskan risiko, dan menelusuri settlement per resi |
| Customer service | Menerima laporan yang sudah membawa konteks paket |
| Finance operations | Mencocokkan settlement dengan mutasi bank secara aman |
| Pemilik usaha | Melihat hubungan operasional dan arus dana dalam satu produk |
| Petugas operasi Anteraja (Admin) | Melihat kasus lintas Seller, membaca konteks resi, dan menangani tiket CS dengan jejak audit |

## Struktur produk

### Tracking publik

Penerima memasukkan nomor resi dan kode akses enam digit. Hasil tracking menampilkan posisi terakhir, estimasi tiba, status ketepatan waktu, perjalanan paket, dan tindakan yang tersedia.

### Ruang Konsumen

Konsumen yang masuk melihat hanya paket yang telah ditautkan secara terverifikasi ke akunnya. Akun tidak dapat melihat tabel pengiriman mentah milik Seller lain. Untuk paket yang belum tertaut, pencarian publik tetap menggunakan resi dan kode akses.

### Pusat operasi Anteraja

Admin mendapat antrean kiriman berisiko lintas Seller, riwayat perjalanan, instruksi penerima, dan tiket CS. Status tiket dapat dipindahkan secara bertahap dengan jejak aktor dan waktu. Admin tidak otomatis boleh mengubah transaksi keuangan Seller.

### Seller operations

Seller memakai control tower untuk mencari resi atau penerima, menyaring tingkat risiko, membuka rincian kiriman, dan mengekspor data yang sedang tampil.

### Finance operations

Arus Dana mengelola pencatatan pemasukan serta biaya. Rekonsiliasi menerima mutasi bank, menampilkan hasil pencocokan, menyimpan transaksi secara atomik, dan mempertahankan riwayat pembatalan. Kategori membantu klasifikasi transaksi dan aturan kata kunci.

### Hubungan antarmodul

Jejak utama produk adalah:

`shipment → event pengiriman → resolution/tiket → settlement → settlement item → baris mutasi bank`

Tracking dan Finance bukan dua produk terpisah. Finance adalah kelanjutan administratif setelah perjalanan paket menghasilkan COD, ongkir, retur, biaya layanan, atau pencairan.

## Lingkup MVP

1. Tracking publik menggunakan resi dan kode akses.
2. Timeline dengan bahasa sehari-hari, lokasi terakhir, estimasi, dan status ketepatan waktu.
3. Penjelasan risiko beserta tindakan perbaikan alamat, penjadwalan ulang, atau safe drop.
4. Tiket CS yang otomatis menyertakan konteks paket.
5. Preferensi notifikasi untuk perubahan bermakna.
6. Control tower seller dengan pencarian, filter, detail, serta ekspor CSV dan JSON.
7. Pencatatan arus dana dan kategori.
8. Impor CSV Bank A dan Bank B dengan status Baru, Cocok, atau Error.
9. Penyimpanan rekonsiliasi atomik, pencegahan duplikasi, riwayat, dan pembatalan aman.
10. Model data shipment dan settlement yang dapat ditelusuri kembali ke mutasi bank.
11. Tiga ruang kerja dengan pembatasan akses di halaman, API, dan RLS.
12. Penanganan tiket oleh Admin dengan audit perubahan status.

## Ukuran keberhasilan

| Indikator | Target awal |
|---|---:|
| Informasi posisi, estimasi, risiko, dan tindakan | Terlihat dalam tampilan awal hasil tracking |
| Jalur dari halaman awal ke tindakan penting | Maksimal tiga interaksi |
| Tiket CS yang meminta pengguna mengulang konteks paket | 0 |
| Baris mutasi yang mendapat status hasil | 100% |
| Kapasitas preview impor | 50.000 baris tanpa error UI |
| Transaksi ganda saat file yang sama diimpor ulang | 0 |
| Pembatalan yang menghapus transaksi lama | 0 |
| Akses data lintas akun | 0 |

## Aturan produk

- Risiko awal memakai aturan deterministik. Jeda scan lebih dari enam jam menandai **Berisiko**; masalah alamat atau penerima menandai **Perlu tindakan**.
- Tracking publik harus memasking informasi pribadi.
- Pengguna hanya dapat mengirim satu resolution untuk satu resi per hari.
- Tiket CS menyimpan snapshot konteks agar riwayat pemeriksaan tidak berubah.
- Ekspor seller harus mengikuti filter dan pencarian yang aktif.
- Baris mutasi yang sudah cocok tidak boleh dibuat ulang.
- Pembatalan hanya menghapus secara lunak transaksi baru yang dibuat oleh impor tersebut.
- Integrasi eksternal memakai outbox sampai API resmi tersedia.
- Aktivasi Admin memerlukan kode resmi sekali pakai yang tidak disimpan sebagai teks polos di database atau repository.

## Di luar lingkup MVP

- Optimasi rute dan prediksi ETA berbasis machine learning.
- Chatbot bebas yang mengambil keputusan operasional.
- Penggantian sistem inti logistik Anteraja.
- Pencairan atau pembayaran otomatis.
- Impor XLSX, PDF, OCR, dan koneksi bank langsung.
- Klaim integrasi API internal Anteraja tanpa kontrak dan akses resmi.

## Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Resi atau kode akses ditebak | Validasi format, rate limit, masking, dan pesan error generik |
| Instruksi penerima bertabrakan | Batasi resolution satu kali per hari dan simpan event atomik |
| Deskripsi bank tidak menyertakan resi | Tandai untuk pemeriksaan dan pertahankan pencarian referensi |
| File CSV besar membuat halaman macet | Parsing asynchronous, status proses, dan batas 50.000 baris |
| Salah kategori | Wajibkan preview dan kategori untuk setiap baris Baru |
| Pembatalan merusak data lama | Batasi pembatalan pada transaksi buatan impor terkait |
| Integrasi eksternal belum tersedia | Simpan pekerjaan pada `integration_outbox` tanpa memalsukan keberhasilan pengiriman |

## Tahap berikutnya

Tahap lanjutan dapat menghubungkan outbox ke provider notifikasi, CS, dan tracking resmi. Perubahan tersebut memerlukan kontrak API, pengelolaan kegagalan pengiriman, serta observability yang terpisah dari MVP ini.
