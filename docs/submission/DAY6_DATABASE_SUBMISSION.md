# Pengumpulan Day 6 - Database Design

## Branch

[Branch `6-db`](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/6-db)

## Berkas yang dinilai

- SQL lengkap: `database/00_full_schema.sql`
- Sample data: `database/01_sample_data.sql`
- ERD WebP: `database/erd/anteraja-database-erd.webp`
- Panduan penggunaan: `database/DATABASE_RUN.md`
- Kamus data: `database/DATA_DICTIONARY.md`
- Pemetaan FRD/UI: `database/FRD_DATA_MAPPING.md`
- Normalisasi: `database/NORMALIZATION.md`
- PDF LMS: `output/pdf/day6-database-report.pdf`

## Hasil pemeriksaan

| Kriteria | Bukti |
|---|---|
| Relasi antar-table | PK/FK dan composite FK terlihat pada SQL, ERD, dan `04_relations.sql` |
| Penamaan konsisten | Nama tabel plural snake_case; PK `id`; FK memakai akhiran `_id` |
| Normalisasi | Penjelasan 1NF, 2NF, 3NF, dan denormalisasi terukur tersedia |
| Sample data | Tracking, event, settlement, mutasi, tiket, notifikasi, dan outbox terisi |
| Dokumentasi | Setup lokal, SQL Editor, verifikasi, dan troubleshooting tersedia |

Gunakan file `day6-database-report.pdf` untuk upload LMS. ZIP di folder Day 6 memuat seluruh artefak database dan salinan PDF tersebut.
