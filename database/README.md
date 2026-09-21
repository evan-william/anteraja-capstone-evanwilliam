# Database Anteraja Finance

Folder ini adalah paket serah-terima database PostgreSQL/Supabase untuk FRD-06 dan konteks shipment settlement.

| File | Fungsi |
|---|---|
| `00_full_schema.sql` | Snapshot skema lengkap untuk project Supabase baru |
| `01_seed_anteraja.sql` | Data contoh shipment dan settlement; dijalankan setelah `supabase/seed.sql` |
| `02_verify_schema.sql` | Pemeriksaan tabel, PK/FK, index, RLS, trigger, dan function |
| `03_smoke_test.sql` | Assertion read-only; gagal bila komponen wajib belum terpasang |
| `04_relations.sql` | Query untuk melihat seluruh relasi PK/FK di PostgreSQL |
| `ERD.md` | Diagram dan penjelasan kardinalitas |
| `DATABASE_RUN.md` | Panduan setup untuk mentor |

Sumber deployment utama tetap `supabase/migrations/`. Jangan menjalankan migration dan `00_full_schema.sql` pada database yang sama.
