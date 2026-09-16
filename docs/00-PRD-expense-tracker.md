# PRD — Expense Tracker

> Dokumen ini berlaku untuk **semua** fitur. Ubah jadi **Rules** Antigravity (scope Workspace).

## 1. Produk

Aplikasi web pencatat keuangan pribadi untuk pengguna di Indonesia. Pengguna mencatat pemasukan dan pengeluaran, mengelompokkannya per kategori, dan memantau kondisi keuangannya.

**Sudah ada di repo:** Kelola Kategori, Tambah Transaksi, data contoh.

## 2. Prinsip Produk

- Angka uang harus akurat.
- Data keuangan bersifat pribadi dan hanya bisa diakses pemiliknya.

## 3. Stack

- Next.js (App Router) + TypeScript strict. Versi mengikuti `package.json`.
- Tailwind CSS + shadcn/ui.
- Supabase: Postgres, Auth, Storage, Edge Functions.
- Zod untuk validasi input.
- Vitest (unit) dan Playwright (e2e).

## 4. Struktur Folder

```
app/                    # halaman
app/api/v1/<resource>/  # route handler API
components/<fitur>/     # komponen per fitur
lib/                    # helper bersama
lib/integrations/<nama>/# klien layanan pihak ketiga
supabase/migrations/    # migrasi SQL
supabase/functions/     # edge functions
```

Fitur baru tidak mengubah file milik fitur lain. Helper baru dibuat sebagai file baru di `lib/`.

## 5. Identitas Pengguna

- User aktif diambil **hanya** lewat `getCurrentUser()` di `lib/auth.ts`. Return: `{ id, email, name } | null`.

## 6. Kamus Data (sudah ada)

### `users`
| Field | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| email | text | unik, lowercase |
| name | text | |
| created_at | timestamptz | |

### `categories`
| Field | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users |
| name | text | unik per user |
| type | text | `expense` / `income` |
| is_archived | boolean | default false |

### `transactions`
| Field | Tipe | Catatan |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users |
| category_id | uuid | FK categories |
| amount | bigint | selalu > 0, rupiah utuh |
| description | text | maks 200 karakter |
| transaction_date | date | tanggal menurut pengguna |
| is_deleted | boolean | soft delete |
| created_at, updated_at | timestamptz | |

Jenis pemasukan/pengeluaran ditentukan `categories.type`, bukan tanda minus.

## 7. Uang & Waktu

- Uang: integer. Tidak ada float di perhitungan uang.
- Tampilan: `formatRupiah()` di `lib/format.ts` → `Rp1.250.000`.
- Zona waktu aplikasi: **Asia/Jakarta**. Helper di `lib/date.ts`. `timestamptz` disimpan UTC.

## 8. Kontrak API

- Prefix `/api/v1/`.
- Sukses: `{ "success": true, "data": ..., "error": null }`
- Gagal: `{ "success": false, "data": null, "error": { "code": "KODE", "message": "pesan untuk user" } }`

## 9. Database

- Satu perubahan skema = satu file migrasi.
- Tabel baru: `id uuid`, `created_at`, `updated_at`, `user_id` bila milik user.

## 10. Integrasi Pihak Ketiga

- Klien integrasi di `lib/integrations/<nama>/`, tidak dipanggil langsung dari komponen.
- Secret hanya di environment variable server.

## 11. UI

- Bahasa Indonesia.
- Komponen dasar dari shadcn/ui.

## 12. Keamanan Kerja Agent

- Tidak membaca, menampilkan, atau mengubah `.env*`.
- Tidak menjalankan `supabase db reset`, `DROP`, `TRUNCATE`, atau hapus data massal tanpa izin eksplisit.
- Tidak menjalankan operasi di mode live/production layanan pihak ketiga.
