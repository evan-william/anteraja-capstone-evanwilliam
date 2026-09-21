# ERD — Anteraja Tracking & Operations

```mermaid
erDiagram
    AUTH_USERS ||--|| USERS : profile
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
    SETTLEMENTS o|--o{ BANK_IMPORT_ROWS : reconciled_by
    TRANSACTIONS o|--o{ BANK_IMPORT_ROWS : matches_or_creates
    CATEGORIES ||--o{ TRANSACTIONS : classifies
    CATEGORIES ||--o{ CATEGORY_RULES : targets
```

Satu resi memiliki banyak event, instruksi penerima, tiket, dan pesan integrasi. Resi dapat masuk ke settlement melalui `settlement_items`; settlement dicocokkan dengan baris mutasi. Jejak dari bank sampai perjalanan paket tetap dapat diaudit.

Semua entitas bisnis memakai `user_id` dan RLS. Relasi kritis memakai composite FK. Tracking publik melewati RPC terkontrol yang memeriksa kode akses dan memasking PII; role publik tidak mendapat akses tabel langsung.
