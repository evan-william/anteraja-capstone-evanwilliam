# Database Anteraja Tracking & Operations

Folder ini memuat rancangan PostgreSQL/Supabase untuk satu produk yang menghubungkan tracking paket, operasional seller, settlement, dan rekonsiliasi mutasi bank. Skema terdiri dari 15 tabel publik, relasi PK/FK, constraint, index, Row Level Security (RLS), trigger, dan RPC untuk proses atomik.

## Isi folder

| Berkas | Kegunaan |
|---|---|
| `00_full_schema.sql` | Skema lengkap yang dibentuk dari seluruh migration dalam urutan timestamp |
| `01_sample_data.sql` | Akun demo dan data contoh lintas tracking, seller, dan Finance |
| `02_verify_schema.sql` | Query inventaris tabel, RLS, policy, dan RPC |
| `03_smoke_test.sql` | Assertion otomatis untuk objek database wajib |
| `04_relations.sql` | Query untuk membaca PK dan FK aktual dari PostgreSQL |
| `DATABASE_RUN.md` | Panduan setup, reset, verifikasi, dan troubleshooting |
| `DATA_DICTIONARY.md` | Fungsi, primary key, foreign key, dan atribut penting setiap tabel |
| `FRD_DATA_MAPPING.md` | Pemetaan kebutuhan FRD dan komponen UI ke tabel atau fungsi |
| `NORMALIZATION.md` | Penjelasan normalisasi, integritas, dan keputusan desain |
| `ERD.md` | ERD versi Mermaid dan penjelasan kardinalitas |
| `erd/anteraja-database-erd.webp` | ERD final untuk pengumpulan tugas |

## Sumber implementasi

Deployment aplikasi tetap memakai file di `supabase/migrations/` berdasarkan urutan timestamp. `00_full_schema.sql` adalah salinan gabungan agar skema mudah dinilai dan dibaca dalam satu berkas. Jangan menjalankan keduanya pada database yang sama.

Mulai dari [DATABASE_RUN.md](DATABASE_RUN.md) untuk menyiapkan database lokal.
