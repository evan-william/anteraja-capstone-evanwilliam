# Database Anteraja Tracking & Operations

Database PostgreSQL/Supabase menghubungkan perjalanan kiriman, tindakan penerima, tiket CS, notifikasi, settlement, dan rekonsiliasi bank.

| File | Kegunaan |
|---|---|
| `DATABASE_RUN.md` | Panduan setup dan pengujian |
| `ERD.md` | Diagram relasi dan aturan integritas |
| `01_seed_anteraja.sql` | Dua skenario tambahan opsional setelah seed utama |
| `02_verify_schema.sql` | Inventaris tabel, RLS, policy, dan RPC |
| `03_smoke_test.sql` | Assertion kelengkapan skema |
| `04_relations.sql` | Daftar PK/FK aktual dari PostgreSQL |
| `00_full_schema.sql` | Snapshot baseline Finance; bukan sumber deployment terbaru |

Sumber deployment yang berlaku adalah seluruh file `supabase/migrations/` sesuai urutan timestamp. `supabase/seed.sql` adalah seed utama dan sudah memuat skenario tracking serta settlement.
