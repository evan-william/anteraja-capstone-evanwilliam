---
trigger: always_on
---

# Expense Tracker Workspace Rule

## Produk

Aplikasi web pencatat keuangan pribadi untuk pengguna Indonesia. Pengguna mencatat pemasukan dan pengeluaran, mengelompokkan transaksi, dan memantau kondisi keuangan.

## Prinsip wajib

- Uang selalu integer rupiah, tidak pernah float.
- Data keuangan hanya dapat diakses pemiliknya.
- Gunakan Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Supabase, Zod, Vitest, dan Playwright sesuai versi `package.json`.
- User aktif hanya diambil melalui `getCurrentUser()` atau `requireCurrentUser()` dari `lib/auth.ts`.
- Jenis transaksi berasal dari `categories.type`, bukan tanda minus.
- Zona waktu aplikasi `Asia/Jakarta`; `timestamptz` disimpan UTC.
- Gunakan `formatRupiah()` untuk tampilan uang.
- API baru memakai prefix `/api/v1/` dan kontrak `{ success, data, error }` dari PRD.
- Satu perubahan skema dibuat sebagai satu migrasi di `supabase/migrations/`.
- Tabel user-owned memiliki `user_id`, RLS, policy per operasi, dan indeks pada kolom filter/FK.
- Klien integrasi pihak ketiga ditempatkan di `lib/integrations/<nama>/` dan secret hanya berasal dari environment server.
- UI berbahasa Indonesia dan memakai komponen dasar shadcn/ui.

## Struktur fitur

- Halaman: `app/`
- API: `app/api/v1/<resource>/`
- Komponen: `components/<fitur>/`
- Helper: `lib/`
- Migrasi: `supabase/migrations/`

## Keamanan agent

- Jangan membaca, menampilkan, mengubah, atau meng-commit `.env*`.
- Jangan menjalankan `supabase db reset`, `DROP`, `TRUNCATE`, atau penghapusan massal tanpa izin eksplisit.
- Jangan menjalankan operasi live/production layanan pihak ketiga.
- Jangan mengubah file fitur lain kecuali navigasi bersama benar-benar memerlukannya.

Sumber lengkap: `docs/00-PRD-expense-tracker.md`.
