# FRD — Anteraja Tracking & Operations

## Requirement

- **FR-01 Pencarian aman:** resi `ANT-[0-9]{6}`, kode akses 6 digit, PII dimasking, 10 request/IP/menit.
- **FR-02 Timeline:** event terbaru, label manusia, penjelasan, waktu, lokasi, rute, layanan, dan estimasi.
- **FR-03 Risiko:** `on_track`, `at_risk`, `action_required`, `resolved`; selalu memakai ikon, label, dan penjelasan.
- **FR-04 Resolution:** alamat (kecamatan, jalan, landmark ≤150, telepon), jadwal ulang, safe drop; maksimal satu instruksi/resi/hari; event dan outbox atomik.
- **FR-05 Tiket CS:** catatan ≤500, ticket number, SLA 2 jam, snapshot exception/lokasi/landmark/5 event terbaru.
- **FR-06 Notifikasi:** WhatsApp/email/push opt-in; default hanya perubahan bermakna; tujuan termasking.
- **FR-07 Control tower:** RLS per seller, filter risiko, pencarian resi/penerima/kota, ekspor CSV/JSON, detail timeline dan tindak lanjut.
- **FR-08 Finance:** shipment terhubung ke settlement; settlement ke mutasi jika nominal bersih cocok; seluruh kontrak import/cancel FRD-06 tetap berlaku.

## Keamanan dan integritas

PK UUID, timestamps, composite FK `(shipment_id, user_id)`, constraint, index, dan RLS wajib aktif. Role publik tidak mendapat akses tabel tracking. Function `security definer` memakai `search_path = ''`. Tracking eksternal tidak dipalsukan: `integration_outbox` menyimpan pekerjaan sinkronisasi sampai adapter produksi tersedia.

## Acceptance demo

`ANT-100015` + `260926` menampilkan “Perlu tindakan”. Pengguna dapat mengirim resolution, melihat “Instruksi diterima”, membuat tiket, dan memilih notifikasi. Seller melihat skenario normal/risiko/tindakan di `/pengiriman`, memfilter, membuka detail, dan mengekspor hasil.
