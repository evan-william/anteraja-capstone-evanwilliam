# ERD - Anteraja Tracking & Operations

Gambar final tersedia pada [`erd/anteraja-database-erd.webp`](erd/anteraja-database-erd.webp). Diagram berikut menyediakan versi teks yang dapat dirawat bersama migration.

```mermaid
erDiagram
    AUTH_USERS ||--|| USERS : creates
    USERS ||--o{ SHIPMENTS : owns
    SHIPMENTS ||--o{ SHIPMENT_EVENTS : records
    SHIPMENTS ||--o{ SHIPMENT_RESOLUTIONS : receives
    SHIPMENTS ||--o{ SUPPORT_TICKETS : escalates
    SHIPMENTS ||--o| NOTIFICATION_PREFERENCES : configures
    SHIPMENTS ||--o{ INTEGRATION_OUTBOX : emits
    USERS ||--o{ SETTLEMENTS : owns
    SETTLEMENTS ||--o{ SETTLEMENT_ITEMS : contains
    SHIPMENTS ||--o{ SETTLEMENT_ITEMS : paid_through
    USERS ||--o{ BANK_IMPORTS : runs
    BANK_IMPORTS ||--o{ BANK_IMPORT_ROWS : contains
    SETTLEMENTS ||--o{ BANK_IMPORT_ROWS : reconciles
    TRANSACTIONS ||--o{ BANK_IMPORT_ROWS : matches_or_creates
    CATEGORIES ||--o{ TRANSACTIONS : classifies
    CATEGORIES ||--o{ CATEGORY_RULES : targets
```

## Kardinalitas utama

Satu resi memiliki banyak event, instruksi penerima, tiket, dan pesan integrasi. Satu resi mempunyai maksimal satu preferensi notifikasi. Resi masuk ke settlement melalui `settlement_items`; settlement kemudian dapat dicocokkan dengan satu atau beberapa baris mutasi.

Semua entitas bisnis memakai `user_id` dan RLS. Relasi kritis memakai composite FK. Tracking publik melewati RPC terkontrol yang memeriksa kode akses dan memasking PII; role publik tidak mendapat akses tabel langsung.

`tracking_rate_limits` berdiri sendiri karena kuncinya adalah client key anonim, bukan akun login. Tabel tersebut melindungi endpoint tracking dari request berlebihan tanpa menyimpan identitas penerima.
