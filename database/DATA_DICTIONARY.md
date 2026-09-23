# Kamus Data Anteraja Tracking & Operations

Kamus data ini menjelaskan fungsi dan atribut utama dari 15 tabel publik. Tipe lengkap, default, constraint, index, trigger, policy, dan function tetap menjadi sumber kebenaran pada `supabase/migrations/`.

## Identity

### `users`

Profil aplikasi yang berpasangan satu-ke-satu dengan `auth.users`.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK, FK | Mengacu ke `auth.users.id`; cascade saat akun dihapus |
| `email` | text | UQ | Email lowercase untuk identifikasi akun |
| `name` | text | - | Nama tampilan |
| `created_at` | timestamptz | - | Waktu profil dibuat |

## Logistics dan tracking

### `shipments`

Entitas pusat untuk pengiriman, dashboard seller, tracking publik, dan settlement.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier shipment |
| `user_id` | uuid | FK | Pemilik data; mengacu ke `users.id` |
| `tracking_number` | text | UQ | Nomor resi publik |
| `service_type` | text | - | regular, next_day, same_day, economy, atau cargo |
| `delivery_status` | text | - | Tahap operasional shipment |
| `risk_status` | text | - | on_track, at_risk, action_required, atau resolved |
| `recipient_name`, `recipient_phone` | text | - | Data penerima; response publik dimasking |
| `origin_city`, `destination_city` | text | - | Rute kota |
| `destination_district`, `destination_street`, `destination_landmark` | text | - | Detail tujuan untuk resolution alamat |
| `estimated_delivery_at`, `last_scan_at`, `delivered_at` | timestamptz | - | ETA dan waktu operasional |
| `exception_code`, `exception_reason` | text | - | Kode dan penjelasan kendala |
| `current_location`, `current_lat`, `current_lng` | text/numeric | - | Posisi scan terakhir |
| `access_code_hash` | text | - | Hash SHA-256 kode akses enam digit |

### `shipment_events`

Timeline perjalanan paket dalam urutan waktu.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier event |
| `user_id` | uuid | FK | Pemilik event |
| `shipment_id`, `user_id` | uuid | FK komposit | Mengacu ke shipment pada akun yang sama |
| `event_code` | text | - | Kode teknis event |
| `status_label`, `description` | text | - | Bahasa yang tampil pada timeline |
| `location`, `latitude`, `longitude` | text/numeric | - | Lokasi event |
| `occurred_at` | timestamptz | - | Waktu event terjadi |

### `shipment_resolutions`

Instruksi penerima untuk memperbaiki alamat, menjadwal ulang, atau memilih safe drop.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier tindakan |
| `shipment_id`, `user_id` | uuid | FK komposit | Shipment dan pemilik yang sama |
| `resolution_type` | text | - | update_address, reschedule, atau safe_drop |
| `payload` | jsonb | - | Detail tindakan sesuai jenisnya |
| `status` | text | - | pending_sync, synced, failed, atau cancelled |
| `submitted_at`, `synced_at` | timestamptz | - | Jejak submit dan sinkronisasi |

### `support_tickets`

Tiket bantuan dengan konteks paket otomatis.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier tiket |
| `shipment_id`, `user_id` | uuid | FK komposit | Shipment dan pemilik yang sama |
| `ticket_number` | text | UQ | Nomor tiket yang ditampilkan |
| `customer_note` | text | - | Laporan maksimal 500 karakter |
| `context_snapshot` | jsonb | - | Kondisi shipment dan lima event terakhir saat tiket dibuat |
| `status` | text | - | open, in_progress, resolved, atau closed |
| `response_due_at` | timestamptz | - | Target respons CS |

### `notification_preferences`

Preferensi kanal notifikasi per shipment.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier preferensi |
| `shipment_id`, `user_id` | uuid | FK komposit | Unik satu baris per shipment |
| `whatsapp_enabled`, `email_enabled`, `push_enabled` | boolean | - | Kanal yang dipilih |
| `meaningful_changes_only` | boolean | - | Membatasi notifikasi ke perubahan penting |
| `destination_masked` | text | - | Tujuan yang sudah dimasking |

### `integration_outbox`

Antrean durable untuk integrasi kurir, CS, dan kanal notifikasi.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier pesan |
| `shipment_id`, `user_id` | uuid | FK komposit | Shipment opsional dan pemilik yang sama |
| `destination` | text | - | courier, customer_service, whatsapp, email, atau push |
| `event_type`, `payload` | text/jsonb | - | Nama event dan isi pesan immutable |
| `status`, `attempts` | text/integer | - | Status proses dan jumlah percobaan |
| `available_at`, `processed_at`, `last_error` | timestamptz/text | - | Penjadwalan dan hasil worker |

### `tracking_rate_limits`

Counter permintaan tracking per client key dan jendela satu menit.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `client_key` | text | PK | Hash/kunci client |
| `window_started_at` | timestamptz | - | Awal jendela pembatasan |
| `request_count` | integer | - | Jumlah request dalam jendela |

## Finance dan rekonsiliasi

### `categories`

Master kategori pemasukan dan pengeluaran per user.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier kategori |
| `user_id` | uuid | FK | Mengacu ke `users.id` |
| `name`, `type` | text | UQ scope user | Nama dan jenis income/expense |
| `is_archived` | boolean | - | Menonaktifkan kategori tanpa menghapus riwayat |

### `transactions`

Arus dana yang dibuat manual atau dari impor bank.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier transaksi |
| `user_id` | uuid | FK | Pemilik transaksi |
| `category_id` | uuid | FK | Mengacu ke `categories.id` dengan delete restrict |
| `amount` | bigint | - | Nilai positif dalam rupiah |
| `description`, `transaction_date` | text/date | - | Uraian dan tanggal transaksi |
| `is_deleted` | boolean | - | Soft delete untuk pembatalan impor |

### `category_rules`

Aturan keyword untuk saran kategori pada preview impor.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier rule |
| `user_id`, `category_id` | uuid | FK | Pemilik dan kategori tujuan |
| `keyword`, `type` | text | UQ scope user/type | Keyword dan jenis transaksi |

### `bank_imports`

Header satu proses impor file mutasi.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier impor |
| `user_id` | uuid | FK | Pemilik impor |
| `file_name`, `bank` | text | - | Nama file dan adapter bank |
| `new_count`, `matched_count`, `error_count` | integer | - | Ringkasan hasil proses |
| `status`, `cancelled_at` | text/timestamptz | - | completed/cancelled dan waktu batal |

### `bank_import_rows`

Hasil normalisasi dan rekonsiliasi setiap baris CSV.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier baris |
| `import_id`, `user_id` | uuid | FK | Parent impor dan pemilik |
| `row_number`, `fingerprint` | integer/text | UQ scope import | Posisi sumber dan kunci anti-duplikasi |
| `transaction_date`, `description`, `amount`, `type` | date/text/bigint/text | - | Data mutasi yang dinormalisasi |
| `status` | text | - | new, matched, atau error |
| `category_id` | uuid | FK | Kategori untuk baris baru |
| `matched_transaction_id` | uuid | FK | Transaksi lama yang cocok |
| `created_transaction_id` | uuid | FK | Transaksi yang dibuat oleh impor |
| `settlement_id` | uuid | FK komposit | Settlement yang direkonsiliasi pada akun yang sama |
| `error_message` | text | - | Penjelasan jika status error |

### `settlements`

Header pencairan dana COD per periode.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier settlement |
| `user_id` | uuid | FK | Pemilik settlement |
| `reference`, `settlement_date` | text/date | UQ scope user | Referensi dan tanggal pencairan |
| `status` | text | - | draft, paid, reconciled, disputed, atau cancelled |
| `gross_amount`, `fee_amount`, `return_amount` | bigint | - | Komponen agregat |
| `net_amount` | bigint | generated | gross dikurangi fee dan return |
| `reconciled_at` | timestamptz | - | Wajib saat status reconciled |

### `settlement_items`

Junction antara settlement dan shipment sekaligus rincian nominal per resi.

| Kolom | Tipe | Kunci | Keterangan |
|---|---|---|---|
| `id` | uuid | PK | Identifier item |
| `settlement_id`, `user_id` | uuid | FK komposit | Settlement dan pemilik yang sama |
| `shipment_id`, `user_id` | uuid | FK komposit | Shipment dan pemilik yang sama |
| `cod_amount`, `shipping_fee`, `service_fee`, `return_amount` | bigint | - | Komponen nilai per shipment |
| `net_amount` | bigint | generated | COD dikurangi ongkir, layanan, dan retur |

## Kolom audit

Sebagian besar tabel menyimpan `created_at` dan `updated_at`. Trigger `set_updated_at` menjaga waktu perubahan. Tabel event dan outbox menambah waktu domain seperti `occurred_at`, `submitted_at`, `available_at`, dan `processed_at` agar kejadian bisnis dapat ditelusuri.
