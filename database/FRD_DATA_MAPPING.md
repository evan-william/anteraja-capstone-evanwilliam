# Pemetaan FRD dan UI ke Database

Dokumen ini menunjukkan bahwa setiap data yang tampil atau diubah pada UI mempunyai sumber yang jelas di database. Pemetaan mengikuti FRD gabungan Anteraja Tracking & Operations.

## Tracking publik

| FRD | Data pada UI | Sumber database | Aturan penting |
|---|---|---|---|
| TRK-01 - TRK-03 | Resi, kode akses, ETA, posisi, rute, layanan | `shipments` dan `get_public_tracking` | Kode akses disimpan sebagai hash; response memasking PII |
| TRK-04 | Timeline perjalanan | `shipment_events` | Diurutkan dari `occurred_at` terbaru |
| TRK-05 | Status tepat waktu dan risiko | `shipments.risk_status`, `exception_code`, `exception_reason` | Trigger mengevaluasi scan terakhir dan exception |
| TRK-06 - TRK-09 | Perbaikan alamat, jadwal ulang, safe drop | `shipment_resolutions` dan `submit_tracking_resolution` | Maksimal satu tindakan per resi per hari UTC |
| TRK-10 - TRK-11 | Form bantuan dan nomor tiket | `support_tickets` dan `create_tracking_ticket` | Snapshot menyimpan konteks dan lima event terbaru |
| TRK-12 | Pilihan WhatsApp, email, push | `notification_preferences` | Satu konfigurasi aktif per shipment |

## Seller operations

| FRD | Data pada UI | Sumber database | Aturan penting |
|---|---|---|---|
| OPS-01 | Ringkasan kiriman aktif | `shipments` | RLS membatasi `user_id` akun aktif |
| OPS-02 | Filter risiko | `shipments.risk_status` | Index `(user_id, risk_status, estimated_delivery_at)` |
| OPS-03 | Pencarian resi, penerima, kota | `tracking_number`, `recipient_name`, `destination_city` | Query tetap berada dalam scope user |
| OPS-04 | Detail dan timeline | `shipments`, `shipment_events`, `shipment_resolutions` | Composite FK menjaga shipment dan child pada akun yang sama |
| OPS-05 | Export CSV dan JSON | Query aplikasi atas `shipments` | Database tidak membuat duplikat data export |
| OPS-06 | Empty state | Hasil query `shipments` kosong | Sample data menyediakan lima skenario demo |

## Finance operations

| FRD | Data pada UI | Sumber database | Aturan penting |
|---|---|---|---|
| FIN-01 | Arus dana | `transactions` | Nominal selalu positif; tipe mengikuti kategori |
| FIN-02 | Kategori dan keyword | `categories`, `category_rules` | Nama kategori unik per user tanpa membedakan kapital |
| FIN-03 - FIN-06 | Preview CSV dan status baris | Data preview di client sebelum disimpan | Batas 50.000 baris ditegakkan kembali pada RPC |
| FIN-07 | Simpan impor | `save_bank_import` | Header, transaksi, rule, dan baris impor disimpan atomik |
| FIN-08 | Anti-duplikasi | `bank_import_rows.fingerprint` | Unik dalam satu `import_id` |
| FIN-09 | Riwayat impor | `bank_imports`, `bank_import_rows` | Menyimpan jumlah Baru, Cocok, Error, dan status |
| FIN-10 | Pembatalan | `cancel_bank_import` | Hanya transaksi Baru dari impor terkait yang di-soft-delete |
| FIN-11 | Referensi resi | `shipments`, `settlement_items` | Finance terhubung ke shipment tanpa mengubah matching bank |
| FIN-12 | COD dan settlement | `settlements`, `settlement_items`, `bank_import_rows` | Generated amount dan composite FK menjaga konsistensi akun |

## Atribut yang berasal dari desain UI

| Komponen UI | Atribut utama |
|---|---|
| Kartu ringkasan paket | `tracking_number`, `service_type`, `estimated_delivery_at`, `recipient_name`, `current_location` |
| Peringatan tindakan | `risk_status`, `exception_code`, `exception_reason` |
| Timeline | `status_label`, `description`, `location`, `occurred_at` |
| Form tindakan | `resolution_type`, `payload`, `status`, `submitted_at` |
| Form laporan CS | `customer_note`, `context_snapshot`, `ticket_number`, `response_due_at` |
| Dashboard pengiriman | `delivery_status`, `risk_status`, `destination_city`, `last_scan_at` |
| Arus dana | `transaction_date`, `description`, `amount`, `category_id`, `is_deleted` |
| Rekonsiliasi | `fingerprint`, `status`, `matched_transaction_id`, `created_transaction_id`, `settlement_id` |

## Batas sistem

Database mencatat pesan yang harus dikirim pada `integration_outbox`, tetapi worker eksternal tidak termasuk dalam scope capstone. Desain ini tidak mengklaim koneksi langsung ke sistem internal Anteraja. Pemisahan tersebut menjaga transaksi utama selesai lebih dulu dan menyediakan jejak retry yang dapat diaudit.
