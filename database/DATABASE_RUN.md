# Menjalankan Database Anteraja Tracking & Operations

## Kebutuhan

- Node.js dan dependency pada `package.json`.
- Project Supabase kosong dan Supabase CLI.
- Project URL serta publishable key. Jangan menaruh key asli di Git.

## Setup

```bash
npm install
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
npx supabase db reset
```

`db push` menerapkan migrasi sesuai timestamp. `db reset` memuat `supabase/seed.sql` dan bersifat destruktif; gunakan hanya pada database local/disposable. Untuk remote demo, jalankan seed satu kali melalui SQL Editor.

Seed membuat akun `demo@contoh.test` dengan password `demo12345`. Resi utama `ANT-100015` memakai kode akses `260926`.

Untuk menambah 300 kiriman fiktif yang dapat dilacak, jalankan `supabase/seed-demo-shipments.sql` lewat SQL Editor **setelah** seed dasar. Alternatif melalui CLI pada project demo ini:

```bash
npx supabase db query --linked --project-ref rfkcbmacwlknowskdwbf --file supabase/seed-demo-shipments.sql
```

Skrip tambahan ini aman dijalankan ulang dan tidak menghapus data lama. Jangan menjalankan `db reset` pada project remote hanya untuk menambah data. Daftar skenario dan contoh resi ada di `docs/prototype/DEMO_SHIPMENTS.md`.

## Environment dan aplikasi

Salin `.env.example` menjadi `.env.local` dan isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Jalankan `npm run dev`, lalu buka `/lacak` untuk tracking publik atau `/masuk` untuk ruang seller.

## Verifikasi

Jalankan `02_verify_schema.sql`, `03_smoke_test.sql`, lalu `04_relations.sql` melalui SQL Editor. Smoke test berhasil bila memberi notice `DATABASE_SMOKE_TEST_OK`.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Jika wrapper npm Windows gagal karena karakter `&` pada path, jalankan binary Node langsung, misalnya `node node_modules/typescript/bin/tsc --noEmit --incremental false`, atau clone ke path sederhana.

## Cara kerja integrasi

`shipment_events` menyimpan perjalanan paket. `shipment_resolutions` menyimpan instruksi penerima maksimal sekali per hari. RPC atomik memperbarui risiko, membuat event, dan menulis `integration_outbox`. Worker produksi nantinya membaca outbox untuk meneruskan pesan ke sistem kurir, CS, WhatsApp, email, atau push. Demo ini tidak mengklaim terhubung ke API internal Anteraja.

Tracking publik membutuhkan resi dan kode akses. RPC mengembalikan nama/telepon yang dimasking. Dashboard seller memakai autentikasi dan RLS. Composite FK `(shipment_id, user_id)` mencegah tautan lintas akun.

## Troubleshooting

- Tracking 404: pastikan seed sudah dimuat dan gunakan kode `260926`.
- Rate limited: tunggu satu menit; batas publik 10 request per IP per menit.
- Instruksi ditolak: hanya kiriman Berisiko/Perlu Tindakan yang menerima resolution, maksimal sekali per hari.
- Data akun lain tidak terlihat: ini perilaku RLS yang benar.
