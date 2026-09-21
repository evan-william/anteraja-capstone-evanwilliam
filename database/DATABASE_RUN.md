# Menjalankan Database Anteraja Finance

## Hasil akhir

Database memakai PostgreSQL melalui Supabase. Setelah setup, aplikasi memiliki autentikasi, isolasi data per pengguna, kategori dan transaksi, impor mutasi FRD-06, serta struktur shipment–settlement yang dapat ditelusuri ke baris mutasi.

## Yang perlu disiapkan mentor

- Node.js sesuai kebutuhan Next.js pada `package.json`.
- Satu project Supabase kosong.
- Supabase CLI untuk jalur migration (direkomendasikan).
- Project URL dan publishable key. Secret key hanya diperlukan untuk proses server yang memang membutuhkannya.
- Email/password provider aktif. Untuk demo lokal, konfirmasi email dapat dimatikan sementara.

Jangan menaruh key asli di Git. Salin `.env.example` menjadi `.env.local`, lalu isi nilainya hanya pada mesin lokal.

## Jalur A — Supabase CLI (direkomendasikan)

Jalankan dari root repository:

```bash
npm install
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Perintah `db push` menerapkan file pada `supabase/migrations/` sesuai urutan timestamp:

1. profil `users` dan trigger dari `auth.users`;
2. trigger `updated_at`;
3. `categories`;
4. `transactions`;
5. tabel dan RPC rekonsiliasi FRD-06;
6. hardening function dan index;
7. `shipments`, `settlements`, `settlement_items`, serta RPC penghubung mutasi.

Untuk local Supabase baru, data demo dapat dimuat dengan:

```bash
npx supabase db reset
```

`db reset` bersifat destruktif. Gunakan hanya pada database lokal/disposable, bukan project yang berisi data penting.

Setelah seed dasar tersedia, jalankan `database/01_seed_anteraja.sql` melalui SQL Editor untuk menambah contoh shipment dan settlement.

## Jalur B — SQL Editor pada project baru

Gunakan hanya bila CLI tidak tersedia:

1. Buka **Supabase Dashboard → SQL Editor**.
2. Buat query baru.
3. Salin seluruh isi `database/00_full_schema.sql` dan jalankan sekali.
4. Jalankan `supabase/seed.sql` bila akun demo diperlukan.
5. Jalankan `database/01_seed_anteraja.sql` untuk data logistik.

Jangan menjalankan `00_full_schema.sql` sesudah `db push`; keduanya memasang skema yang sama.

## Environment aplikasi

Buat `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

Kemudian:

```bash
npm run dev
```

Buka `http://localhost:3000/masuk`. Preview desain tanpa login tersedia di `/ui-preview?screen=dashboard`.

## Verifikasi database

Jalankan berurutan di SQL Editor:

1. `database/02_verify_schema.sql` untuk daftar objek dan status RLS.
2. `database/03_smoke_test.sql` untuk assertion wajib. Hasil sukses adalah pesan `DATABASE_SMOKE_TEST_OK`.
3. `database/04_relations.sql` untuk meninjau PK/FK dan aturan `ON DELETE`.

Verifikasi aplikasi:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Pada Windows, path repository yang mengandung `&` dapat membuat wrapper `.cmd` npm salah membaca path. Jika terjadi, pindahkan clone ke path sederhana seperti `D:\projects\anteraja-finance` atau jalankan binary Node secara langsung. Masalah ini tidak berasal dari skema database.

## Relasi dan aturan penting

- `users.id` mengikuti `auth.users.id` dan dihapus cascade saat akun auth dihapus.
- Kategori memiliki banyak transaksi. `transactions.category_id` memakai `ON DELETE RESTRICT`, jadi kategori yang masih dipakai tidak dapat dihapus; aplikasi sebaiknya mengarsipkannya.
- Satu `bank_import` memiliki banyak `bank_import_rows` (`ON DELETE CASCADE`).
- Baris Cocok menunjuk transaksi lama lewat `matched_transaction_id`; baris Baru menunjuk transaksi hasil impor lewat `created_transaction_id`.
- Satu settlement memiliki banyak item shipment. Composite FK `(id, user_id)` mencegah relasi lintas pemilik, bahkan bila kode server salah.
- `net_amount` dihitung database; trigger menghitung ulang total settlement setelah item berubah.
- RPC `link_bank_row_to_settlement` hanya menerima nominal mutasi yang sama dengan settlement bersih.
- RLS membatasi semua tabel milik user berdasarkan `auth.uid()`.

## Batas implementasi

Struktur database sudah siap menyimpan shipment dan settlement, tetapi aplikasi belum memanggil API tracking eksternal. Integrasi tersebut membutuhkan endpoint, credential, SLA, dan mapping status resmi. Sampai itu tersedia, shipment dapat diisi dari sumber internal atau proses import terkontrol.

## Troubleshooting

- **`relation auth.users does not exist`** — script dijalankan pada PostgreSQL biasa. Gunakan Supabase, atau sediakan sistem auth yang kompatibel terlebih dahulu.
- **`permission denied`** — pastikan migration dijalankan oleh owner project, bukan role `anon`/`authenticated`.
- **Data user lain tidak terlihat** — ini perilaku benar dari RLS.
- **Kategori gagal dihapus** — kategori masih direferensikan transaksi (`ON DELETE RESTRICT`); ubah menjadi archived.
- **Nominal settlement tidak cocok** — pastikan jumlah item menghasilkan `net_amount` yang sama dengan nominal mutasi.
