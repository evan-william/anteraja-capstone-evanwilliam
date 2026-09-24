# FRD — Anteraja Tracking & Operations

## Tujuan dokumen

Dokumen ini menjadi satu sumber functional requirement untuk tracking, seller operations, dan finance operations. ID memakai prefix per domain agar requirement tracking dan rekonsiliasi tidak bertabrakan.

## Autentikasi dan keamanan akun

| ID | Requirement | Kriteria terima |
|---|---|---|
| AUTH-01 | Daftar dan masuk | Pengguna dapat membuat akun dan masuk menggunakan Supabase Auth |
| AUTH-02 | Isolasi data | Row Level Security membatasi data seller dan Finance berdasarkan `user_id` |
| AUTH-03 | Credential | `.env.local` tidak ter-track; `.env.example` hanya memuat placeholder |
| AUTH-04 | Pilihan role | Pendaftaran menyediakan Konsumen, Seller, dan Admin; Admin baru aktif setelah kode resmi diverifikasi server |
| AUTH-05 | Aktivasi Admin | Kode disimpan sebagai hash, sekali pakai, kedaluwarsa, dan dibatasi lima percobaan per jam per akun |
| AUTH-06 | Isolasi role | Admin membaca semua kiriman dan tiket; Seller hanya data miliknya; Konsumen hanya proyeksi paket yang ditautkan; URL/API/RLS memeriksa izin |

## Tracking publik

| ID | Requirement | Kriteria terima |
|---|---|---|
| TRK-01 | Pencarian aman | Resi mengikuti `ANT-[0-9]{6}` dan kode akses terdiri dari enam digit |
| TRK-02 | Privasi | Response publik memasking informasi pribadi dan membatasi 10 request per IP per menit |
| TRK-03 | Ringkasan | Hasil menampilkan posisi terakhir, ETA, status ketepatan waktu, rute, serta layanan |
| TRK-04 | Timeline | Event terbaru tampil dalam bahasa sehari-hari beserta penjelasan, waktu, dan lokasi |
| TRK-05 | Risiko | Status `on_track`, `at_risk`, `action_required`, atau `resolved` selalu memakai ikon, label, dan penjelasan |
| TRK-06 | Perbaikan alamat | Pengguna dapat mengirim kecamatan, jalan, landmark maksimal 150 karakter, dan nomor penerima |
| TRK-07 | Penjadwalan ulang | Pengguna dapat memilih tanggal baru dan menambahkan catatan |
| TRK-08 | Safe drop | Pengguna dapat memilih tempat aman, lokasi penitipan, dan nomor penerima |
| TRK-09 | Batas tindakan | Satu resi menerima maksimal satu resolution per hari |
| TRK-10 | Tiket CS | Pengguna dapat membuat tiket dengan catatan maksimal 500 karakter dan target respons dua jam |
| TRK-11 | Konteks tiket | Tiket menyimpan nomor resi, exception, lokasi, landmark, dan lima event terbaru |
| TRK-12 | Preferensi notifikasi | Pengguna dapat opt-in WhatsApp, email, atau push untuk perubahan bermakna |

Resolution harus membuat perubahan status, event, dan pekerjaan integrasi dalam satu transaksi PostgreSQL. Kegagalan satu operasi harus membatalkan seluruh perubahan.

## Seller operations

| ID | Requirement | Kriteria terima |
|---|---|---|
| OPS-01 | Control tower | Halaman `/pengiriman` menampilkan ringkasan dan daftar kiriman milik akun aktif |
| OPS-02 | Filter | Pengguna dapat menyaring risiko tanpa mengubah sumber data |
| OPS-03 | Pencarian | Pencarian menerima nomor resi, penerima, atau kota |
| OPS-04 | Detail | Pengguna dapat membuka timeline, risiko, dan tindak lanjut satu kiriman |
| OPS-05 | Ekspor | CSV dan JSON berisi data yang sama dengan filter aktif di layar |
| OPS-06 | Empty state | Akun kosong mendapat penjelasan dan petunjuk tentang akun demo |

## Pusat operasi dan ruang Konsumen

| ID | Requirement | Kriteria terima |
|---|---|---|
| ADM-01 | Antrean lintas Seller | Admin melihat kiriman aktif berisiko/perlu tindakan dari seluruh Seller tanpa hak mengubah Finance mereka |
| ADM-02 | Detail kasus | Admin dapat menelusuri event, instruksi penerima, dan tiket CS dari satu resi |
| ADM-03 | Penanganan tiket | Hanya Admin dapat mengubah tiket dari Baru → Sedang ditangani → Selesai; setiap transisi menyimpan aktor dan waktu |
| CSM-01 | Paket saya | Konsumen hanya melihat paket yang ditautkan secara terverifikasi ke akunnya melalui proyeksi terbatas |
| CSM-02 | Pelacakan lain | Paket belum ditautkan tetap bisa dicari dengan resi dan kode akses; kode demo bersama tidak otomatis membuktikan kepemilikan akun |

## Finance operations

| ID | Requirement | Kriteria terima |
|---|---|---|
| FIN-01 | Arus dana | Pengguna dapat melihat dan mencatat pemasukan atau pengeluaran |
| FIN-02 | Kategori | Pengguna dapat mengelola kategori dan aturan kata kunci |
| FIN-03 | Unggah CSV | Sistem menerima CSV Bank A atau Bank B, maksimal 10 MB |
| FIN-04 | Deteksi format | Isi header dan kolom menentukan adapter; nama file tidak menentukan format |
| FIN-05 | Preview | Setiap baris menampilkan tanggal, keterangan, nominal, dan status Baru, Cocok, atau Error |
| FIN-06 | Validasi kategori | Semua baris Baru harus memiliki kategori sebelum disimpan |
| FIN-07 | Simpan atomik | Baris Baru dibuat, baris Cocok ditautkan, dan baris Error diabaikan dalam satu transaksi |
| FIN-08 | Anti-duplikasi | Fingerprint data mutasi yang dinormalisasi mencegah transaksi ganda |
| FIN-09 | Riwayat | Riwayat memuat file, bank, waktu, jumlah tiap status, dan status proses |
| FIN-10 | Pembatalan | Pembatalan hanya melakukan soft-delete transaksi Baru dari impor terkait |
| FIN-11 | Konteks shipment | Referensi resi dapat tampil tanpa mengubah aturan matching finansial |
| FIN-12 | Settlement | Rincian menghubungkan resi, COD, ongkir, biaya, retur, nilai bersih, dan mutasi terkait |

## Keadaan antarmuka

| Alur | Keadaan yang wajib tersedia |
|---|---|
| Autentikasi | default, loading, error, dan berhasil |
| Tracking | awal, loading, resi/kode tidak valid, tidak ditemukan, ditemukan, sudah pernah mengirim resolution, dan rate limit |
| Seller | data terisi, kosong, filter tanpa hasil, loading, error, dan data panjang |
| Rekonsiliasi | awal, memproses, preview campuran, validasi gagal, simpan gagal, simpan berhasil, riwayat kosong, dan pembatalan |

Semua tindakan harus dapat dioperasikan dengan keyboard. Focus harus terlihat. Status tidak boleh hanya dibedakan lewat warna. Tabel pada layar kecil dapat digulir tanpa memotong aksi penting.

## Data dan integritas

- `shipments` menyimpan identitas kiriman dan status terkini.
- `shipment_events` menyimpan perjalanan paket.
- `shipment_resolutions` menyimpan instruksi penerima.
- `support_tickets` menyimpan laporan beserta snapshot konteks.
- `account_roles`, `admin_activation_codes`, dan `recipient_shipments` memisahkan hak akses.
- `admin_ticket_actions` mencatat transisi tiket yang dilakukan petugas.
- `notification_preferences` menyimpan opt-in channel.
- `settlements` dan `settlement_items` menghubungkan nilai pengiriman dengan pencairan.
- `bank_imports` dan `bank_import_rows` menyimpan proses rekonsiliasi.
- `transactions`, `categories`, dan `category_rules` menyimpan arus dana serta klasifikasinya.
- `integration_outbox` menyimpan pekerjaan untuk adapter eksternal.

Relasi lintas entitas milik pengguna harus memakai `user_id` dan composite foreign key bila diperlukan. Function dengan `security definer` harus menetapkan `search_path = ''`. Role publik tidak mendapat akses tabel tracking secara langsung.

## Rute implementasi

| Area | Rute |
|---|---|
| Pencarian tracking | `/lacak` |
| Hasil tracking | `/lacak/[awb]` |
| Seller operations | `/pengiriman` dan `/pengiriman/[awb]` |
| Arus dana | `/transaksi` |
| Rekonsiliasi | `/import` |
| Kategori | `/kategori` |

## Acceptance demo

1. Buka `/lacak`.
2. Masukkan resi `ANT-100015` dan kode `260926`.
3. Pastikan posisi, ETA, status **Perlu tindakan**, dan timeline tampil.
4. Kirim salah satu resolution dan pastikan status berubah menjadi **Instruksi diterima**.
5. Aktifkan preferensi notifikasi.
6. Buat tiket CS dan pastikan nomor tiket tampil.
7. Masuk sebagai seller, buka `/pengiriman`, lalu uji filter, pencarian, detail, dan ekspor.
8. Buka `/import`, unggah salah satu CSV pada `docs/data`, periksa preview, simpan, lalu uji pembatalan.

Provider WhatsApp, email, dan push belum production-connected. MVP menyimpan preferensi dan pekerjaan outbox agar integrasi resmi dapat ditambahkan tanpa mengubah kontrak UI atau transaksi utama.

## Persyaratan tambahan untuk implementasi tiga role

Tabel ini menambah kriteria terima di atas; tidak mengganti atau mengurangi AUTH, TRK, OPS, ADM, CSM, maupun FIN yang sudah tercatat.

| ID | Requirement | Kriteria terima |
|---|---|---|
| AUTH-07 | Submit login aman | Form `/masuk` memakai POST. Password dan email tidak muncul di query URL, termasuk ketika JavaScript belum aktif. Sukses mengarahkan ke halaman awal role dari database. |
| AUTH-08 | Pemulihan login | Password salah dan layanan autentikasi tidak tersedia menghasilkan pesan berbeda yang tidak membocorkan keberadaan akun; email yang diketik tetap tersedia untuk koreksi. |
| AUTH-09 | Form kredensial lain | Form `/daftar` dan `/aktivasi-admin` tidak memakai GET untuk mengirim password atau kode. Browser tidak boleh menaruh nilai tersebut di address bar. |
| ADM-04 | Batas operasi Admin | Halaman `/admin/finance` hanya membaca ringkasan lintas Seller; perubahan transaksi, kategori, atau impor Seller tetap ditolak di API/RLS. |
| ADM-05 | Detail kiriman Admin | Dari `/admin/kiriman`, Admin dapat membuka `/admin/pengiriman/[awb]` dan membaca riwayat tanpa mengambil alih kepemilikan Seller. |
| CSM-03 | Batas paket akun | Halaman `/akun` mengambil hanya paket yang terhubung ke user aktif melalui tautan terverifikasi. Resi/kode publik tidak menambahkan tautan kepemilikan secara otomatis. |
| OPS-07 | Prioritas Seller | Halaman `/seller` mengarahkan Seller ke daftar pengiriman miliknya; pencarian dan filter di `/pengiriman` tetap mempertahankan batas `user_id`. |

## Matriks rute dan akses

| Rute | Publik | Konsumen | Seller | Admin |
|---|---|---|---|---|
| `/lacak`, `/lacak/[awb]` | Resi + kode | Resi + kode | Resi + kode | Resi + kode |
| `/akun` | Masuk dahulu | Paket tertaut | Ditolak | Ditolak |
| `/seller`, `/pengiriman`, `/pengiriman/[awb]` | Masuk dahulu | Ditolak | Data sendiri | Ditolak; gunakan rute Admin |
| `/transaksi`, `/import`, `/kategori` | Masuk dahulu | Ditolak | Data sendiri | Ditolak untuk perubahan |
| `/admin`, `/admin/kiriman`, `/admin/pengiriman/[awb]`, `/admin/tiket`, `/admin/finance` | Masuk dahulu | Ditolak | Ditolak | Sesuai batas baca/tulis Admin |

Pemeriksaan rute hanyalah lapisan pertama. Query data, RPC, dan kebijakan RLS harus menegakkan batas yang sama. Menu tersembunyi bukan mekanisme otorisasi.

## Skenario verifikasi tambahan

1. Buka `/masuk` dengan JavaScript aktif dan nonaktif. Kirim kredensial demo yang valid; pastikan URL tidak pernah memuat `email`, `password`, atau nilainya, lalu pastikan landing role sesuai akun.
2. Uji password salah dan jaringan autentikasi gagal. Form tetap menampilkan pesan pemulihan tanpa mengungkap akun dan tanpa mengirim password lewat URL.
3. Masuk bergantian sebagai Konsumen, Seller, dan Admin. Buka rute role lain secara langsung; pastikan server menolak akses dan tidak mengirim data terlarang.
4. Dari akun Seller, uji filter, pencarian, detail, dan ekspor. Dari Admin, uji daftar lintas Seller serta perubahan status tiket; pastikan audit aktor dan waktu tercatat.
5. Dari akun Konsumen, uji paket tertaut dan pencarian paket lain melalui resi plus kode. Pencarian publik tidak otomatis menautkan paket ke akun.

Data demo, peta, dan outbox tidak boleh ditafsirkan sebagai scan kurir, pengiriman pesan, atau pergerakan dana nyata. Bukti operasi nyata memerlukan integrasi resmi dan pengujian terpisah.
