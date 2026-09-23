# Menjalankan Database Anteraja Tracking & Operations

Panduan ini menyiapkan database PostgreSQL melalui Supabase CLI, memuat sample data, dan memverifikasi bahwa tabel, relasi, RLS, serta RPC tersedia. Gunakan database lokal atau project development karena perintah reset menghapus data yang ada.

## Prasyarat

- Node.js sesuai versi pada project.
- Docker Desktop aktif untuk Supabase lokal.
- Supabase CLI tersedia melalui `npx`.
- File `.env.local` hanya berada di komputer Anda dan tidak masuk Git.

## Opsi A: jalankan dengan Supabase lokal

1. Buka terminal di root repository.
2. Instal dependency aplikasi:

   ```bash
   npm install
   ```

3. Mulai layanan Supabase lokal:

   ```bash
   npx supabase start
   ```

4. Terapkan seluruh migration dan sample data:

   ```bash
   npx supabase db reset
   ```

5. Salin URL dan anon key lokal yang muncul ke `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY_LOKAL>
   ```

6. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

7. Masuk menggunakan akun demo berikut:

   ```text
   Email: demo@contoh.test
   Password: demo12345
   Resi: ANT-100015
   Kode akses: 260926
   ```

`db reset` menjalankan semua file `supabase/migrations/` kemudian `supabase/seed.sql`. Seed utama dapat dijalankan berulang karena data akun demo dibersihkan lebih dahulu.

## Opsi B: jalankan dari SQL Editor Supabase

Gunakan opsi ini pada project development kosong.

1. Buka SQL Editor di dashboard Supabase.
2. Jalankan `database/00_full_schema.sql` satu kali.
3. Jalankan `database/01_sample_data.sql` satu kali.
4. Jalankan `database/03_smoke_test.sql`.
5. Pastikan output memuat notice `DATABASE_SMOKE_TEST_OK`.

Jangan menjalankan `00_full_schema.sql` setelah migration sudah diterapkan. Berkas itu berisi isi migration yang sama dalam satu file.

## Verifikasi struktur

Jalankan berkas berikut melalui SQL Editor:

1. `02_verify_schema.sql` untuk melihat 15 tabel, status RLS, policy, dan RPC.
2. `03_smoke_test.sql` untuk menghentikan proses jika tabel atau RPC wajib hilang.
3. `04_relations.sql` untuk menampilkan PK dan FK aktual.

Hasil minimum yang diharapkan:

| Pemeriksaan | Hasil |
|---|---|
| Tabel publik | 15 tabel ditemukan |
| RLS | Aktif pada seluruh tabel publik |
| RPC impor | `save_bank_import` dan `cancel_bank_import` tersedia |
| RPC tracking | Tracking, resolution, tiket, dan notifikasi tersedia |
| Relasi akun | Data operasional memakai `user_id` |
| Relasi shipment | Child table memakai composite FK `(shipment_id, user_id)` |

## Verifikasi aplikasi

Jalankan quality gate berikut dari root repository:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Kemudian periksa alur utama:

1. Buka `/lacak`, masukkan `ANT-100015` dan `260926`.
2. Pastikan timeline, ETA, risiko, dan tindakan penerima tampil.
3. Buka `/pengiriman` setelah login dan pastikan data hanya milik akun demo.
4. Buka `/impor`, preview CSV, lalu pastikan penyimpanan membuat riwayat impor.
5. Buka `/rekonsiliasi` dan pastikan settlement dapat ditautkan ke baris mutasi.

## Cara kerja integritas data

- `auth.users` menjadi sumber identitas. Trigger membuat profil pada `public.users`.
- Setiap tabel milik akun membawa `user_id`; policy RLS membandingkannya dengan `auth.uid()`.
- Composite FK `(shipment_id, user_id)` dan `(settlement_id, user_id)` mencegah relasi lintas akun.
- RPC `save_bank_import` menyimpan header impor, transaksi baru, dan baris rekonsiliasi dalam satu transaksi database.
- Index unik fingerprint mencegah baris mutasi yang sama masuk dua kali pada satu impor.
- Generated column menghitung nilai bersih settlement dari komponen nominal.
- `integration_outbox` memisahkan transaksi aplikasi dari pengiriman pesan ke kurir, CS, WhatsApp, email, atau push.

## Troubleshooting

### Tracking tidak ditemukan

Pastikan sample data sudah dimuat. Gunakan resi `ANT-100015` dengan kode `260926`.

### Login akun demo gagal

Jalankan `npx supabase db reset` kembali pada database lokal. Seed membuat baris `auth.users` dan `auth.identities` untuk provider email.

### Perintah reset gagal

Pastikan Docker Desktop aktif dan tidak ada layanan lain yang memakai port Supabase lokal. Jalankan `npx supabase status` untuk melihat status container.

### Data akun lain tidak terlihat

Ini adalah perilaku RLS yang benar. Gunakan akun yang membuat data tersebut atau periksa policy melalui `02_verify_schema.sql`.

### Resolution ditolak

Resolution hanya berlaku untuk kiriman berstatus `at_risk` atau `action_required`, maksimal satu kali per resi per hari UTC.
