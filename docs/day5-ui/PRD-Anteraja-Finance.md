# PRD — Anteraja Finance (Modul Pendukung)

> Posisi terbaru: Finance/Rekonsiliasi mendukung produk utama Anteraja Tracking & Operations. Scope di bawah tetap berlaku untuk jejak resi → settlement → mutasi bank.

## Ringkasan

Anteraja Finance membantu seller dan tim finance operations mencocokkan mutasi rekening dengan pencatatan settlement pengiriman. Produk ini meneruskan fondasi Expense Tracker dan implementasi FRD-06; konteksnya dipersempit ke arus dana logistik seperti COD, ongkir, biaya layanan, retur, dan pencairan marketplace.

Masalah utamanya bukan sekadar mencari posisi paket. Tim perlu menjawab pertanyaan lanjutan: apakah dana dari pengiriman yang selesai sudah masuk, apakah nilainya sesuai setelah potongan, dan mutasi mana yang masih membutuhkan pemeriksaan.

## Pengguna dan pekerjaan utama

| Pengguna | Pekerjaan yang ingin diselesaikan | Hambatan saat ini |
|---|---|---|
| Finance operations | Mencocokkan mutasi bank dengan pencatatan settlement | Deskripsi bank tidak seragam dan pemeriksaan spreadsheet memakan waktu |
| Seller administrator | Menelusuri dana berdasarkan referensi pengiriman | Nomor resi, transaksi, dan mutasi berada di tempat berbeda |
| Pemilik usaha | Melihat dana masuk, biaya, dan kasus belum cocok | Ringkasan operasional terlambat dan sulit diaudit |

## Tujuan produk

1. Mempercepat rekonsiliasi mutasi tanpa menghilangkan tahap pemeriksaan manusia.
2. Membuat hubungan antara arus dana dan pengiriman mudah ditelusuri.
3. Mencegah transaksi ganda saat file mutasi diunggah ulang.
4. Menyediakan pembatalan yang aman dan riwayat yang dapat diaudit.

## Ukuran keberhasilan

| Indikator | Target awal | Cara ukur |
|---|---:|---|
| Baris yang berhasil diproses | 50.000 baris tanpa halaman membeku | Uji Chrome DevTools |
| Mutasi yang dapat ditinjau | 100% mendapat status Baru, Cocok, atau Error | Preview impor |
| Duplikasi saat file yang sama diimpor ulang | 0 transaksi ganda | Fingerprint dan matching |
| Pembatalan merusak transaksi lama | 0 kejadian | Uji sebelum/sesudah/batal |
| Tugas utama pada desktop dan mobile | Dapat diselesaikan tanpa overflow | Pemeriksaan visual dan keyboard |

## Lingkup versi ini

- Autentikasi pengguna dan isolasi data dengan Supabase.
- Pencatatan arus dana dan kategori.
- Impor CSV Bank A dan Bank B dengan deteksi isi file.
- Preview status Baru, Cocok, dan Error.
- Kategori serta aturan kata kunci untuk baris baru.
- Penyimpanan dan penautan hasil secara atomik.
- Riwayat dan pembatalan impor.
- Konteks nomor resi pada rancangan UI untuk menelusuri settlement pengiriman.
- Model PostgreSQL untuk shipment, settlement, item settlement, dan relasinya ke baris mutasi.

## Di luar lingkup

- Mengambil status tracking dari API Anteraja secara langsung.
- Pencairan atau pembayaran otomatis.
- Dukungan XLSX, PDF, OCR, dan koneksi bank langsung.
- Mengubah data operasional pengiriman dari aplikasi finance.

## Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Deskripsi bank tidak menyertakan nomor resi | Kecocokan shipment tidak selalu otomatis | Tampilkan sebagai Perlu dicek dan sediakan pencarian referensi |
| CSV besar membuat UI macet | Pengguna mengira aplikasi rusak | Parsing asynchronous/Web Worker, status proses, batas 50.000 baris |
| Salah kategori | Laporan biaya menjadi keliru | Preview wajib, kategori per baris, aturan dapat ditinjau |
| Pembatalan menghapus data lama | Kehilangan data | Hanya soft-delete transaksi yang dibuat oleh import terkait |
| Kredensial terpapar | Akses tidak sah | `.env.local` diabaikan Git dan `.env.example` hanya placeholder |

## Tahapan pengembangan

1. **MVP FRD-06:** impor, preview, matching, kategori, simpan, riwayat, batal.
2. **Shipment context:** referensi resi dan rincian settlement pada antarmuka.
3. **Integrasi lanjutan:** adapter API tracking resmi jika akses dan kontrak datanya tersedia.

Versi Day 5 menyelesaikan rancangan UI dan fondasi database tahap kedua. Hal ini menjaga desain tetap realistis: referensi shipment sudah memiliki model penyimpanan, tetapi tidak mengklaim integrasi API tracking yang belum dibangun.

## Model data shipment

Satu user memiliki banyak shipment dan settlement. Satu settlement merangkum banyak `settlement_items`; setiap item menunjuk satu shipment dan menyimpan nilai COD, ongkir, biaya layanan, retur, serta nilai bersih yang dihitung database. Baris mutasi dapat ditautkan ke settlement setelah nominalnya sama. Detail PK, FK, aturan delete, dan RLS tersedia di `database/ERD.md` dan `database/DATABASE_RUN.md`.
