# Normalisasi dan Integritas Database

Skema menggunakan PostgreSQL dan memenuhi bentuk normal ketiga (3NF) untuk data operasional utama. Data yang sengaja disimpan sebagai snapshot atau JSON dijelaskan sebagai keputusan audit, bukan duplikasi tanpa aturan.

## First Normal Form (1NF)

Setiap tabel memiliki primary key dan setiap kolom menyimpan satu nilai logis. Riwayat perjalanan tidak disimpan sebagai array di `shipments`; setiap scan menjadi satu baris `shipment_events`. Rincian settlement juga dipisah menjadi satu baris per shipment pada `settlement_items`.

## Second Normal Form (2NF)

Tabel junction menyimpan atribut yang bergantung pada keseluruhan relasi. Nilai COD, ongkir, biaya layanan, retur, dan nilai bersih berada pada `settlement_items` karena nilainya bergantung pada pasangan settlement dan shipment. Constraint unik `(settlement_id, shipment_id)` mencegah pasangan ganda.

## Third Normal Form (3NF)

- Nama dan tipe kategori hanya berada di `categories`; `transactions` menyimpan `category_id`.
- Metadata file impor berada di `bank_imports`; detail baris berada di `bank_import_rows`.
- Data header settlement berada di `settlements`; rincian per resi berada di `settlement_items`.
- Profil akun berada di `users`; tabel bisnis hanya menyimpan `user_id`.
- Timeline, tindakan penerima, tiket, dan preferensi notifikasi mempunyai tabel terpisah karena siklus hidupnya berbeda.

## Denormalisasi yang disengaja

| Atribut | Alasan |
|---|---|
| `support_tickets.context_snapshot` | Tiket mempertahankan konteks saat dibuat meskipun shipment berubah kemudian |
| `shipment_resolutions.payload` | Bentuk data berbeda untuk alamat, jadwal ulang, dan safe drop; kolom inti tetap terstruktur |
| `integration_outbox.payload` | Pesan integrasi bersifat immutable dan dapat dicoba ulang |
| `bank_imports.new_count`, `matched_count`, `error_count` | Mempercepat riwayat impor; RPC menghitungnya dalam transaksi yang sama |

## Relasi dan cardinality

- Satu user memiliki banyak shipment, transaksi, kategori, impor, dan settlement.
- Satu shipment memiliki banyak event, resolution, tiket, dan pesan outbox.
- Satu shipment memiliki maksimal satu baris preferensi notifikasi.
- Satu settlement memiliki banyak item dan satu shipment dapat muncul pada settlement berbeda selama pasangannya unik.
- Satu impor memiliki banyak baris; setiap baris dapat menautkan transaksi lama, transaksi baru, atau settlement.

## Perlindungan integritas

### Foreign key

Relasi wajib memakai `ON DELETE CASCADE` ketika child tidak bermakna tanpa parent, misalnya event terhadap shipment. Relasi ke kategori dan shipment finansial memakai `RESTRICT` bila penghapusan akan merusak jejak audit.

### Composite foreign key

`settlement_items`, `shipment_events`, `shipment_resolutions`, `support_tickets`, `notification_preferences`, dan `integration_outbox` membawa `user_id`. Composite FK memastikan child dan parent berasal dari akun yang sama. Pemeriksaan ini tetap berlaku walau kode aplikasi salah mengirim identifier.

### Check constraint

Enum berbasis text dibatasi dengan `CHECK`. Nominal tidak boleh negatif, koordinat harus berada pada rentang bumi, catatan memiliki batas panjang, dan status reconciled memerlukan waktu rekonsiliasi.

### Unique constraint dan index

Nomor resi bersifat unik. Referensi settlement unik per user. Nama kategori unik per user tanpa membedakan kapital. Index parsial mempercepat outbox yang belum selesai dan tautan transaksi yang tidak null.

### Row Level Security

RLS aktif pada seluruh tabel publik. Query seller dan Finance membandingkan `user_id` dengan `auth.uid()`. Tracking publik tidak memperoleh akses langsung ke tabel; akses dilakukan melalui RPC yang memeriksa resi dan hash kode akses serta memasking data pribadi.

## Kesimpulan

Desain 3NF mengurangi duplikasi dan anomaly saat insert, update, atau delete. Snapshot JSON hanya dipakai pada titik yang memerlukan riwayat immutable atau payload bervariasi, sementara identifier, status, nominal, waktu, dan relasi tetap menggunakan kolom terstruktur dan constraint PostgreSQL.
