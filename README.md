# Studi Kasus Advanced: Antigravity + Multi-MCP

Repo ini berisi aplikasi **Expense Tracker** yang udah jalan, satu PRD, dan **15 FRD fitur advanced**. Pilih satu FRD, lalu bangun sampai selesai pakai Antigravity.

---

## Menjalankan Repo Ini

### 1. Clone dan install

```bash
git clone <url-repo-ini>
cd repo-peserta-studi-kasus
npm install
```

### 2. Bikin project Supabase sendiri

Buka [supabase.com/dashboard](https://supabase.com/dashboard), bikin project baru (free tier cukup). Catat dari **Project Settings → API Keys**:

- Project URL
- **Publishable key** (`sb_publishable_...`) — aman dipakai di browser
- **Secret key** (`sb_secret_...`) — hanya untuk server

Di **Authentication → Providers → Email**, matikan **Confirm email**. Tanpa ini, akun baru belum punya sesi sampai emailnya dikonfirmasi, dan test e2e bakal gagal.

### 3. Isi environment variable

```bash
cp .env.example .env.local
```

Buka `.env.local`, isi dengan kredensial dari langkah 2. File `.env.local` sudah masuk `.gitignore` — jangan pernah di-commit.

### 4. Jalankan migrasi

File migrasi ada di `supabase/migrations/`, urut berdasarkan prefix timestamp.

**Cara cepat (SQL Editor):** buka **SQL Editor** di dashboard Supabase, lalu jalankan isi tiap file migrasi satu per satu, dari nomor terkecil ke terbesar.

**Cara CLI:**

```bash
npx supabase login
npx supabase link --project-ref <project-ref-kamu>
npx supabase db push
```

### 5. Jalankan seed

Isi `supabase/seed.sql` ke **SQL Editor**, lalu jalankan. Seed ini aman diulang — data demo lama dihapus dulu di awal script.

Akun demo yang dibuat: `demo@contoh.test` / `demo12345` (8 kategori, 32 transaksi tersebar di ~3 bulan terakhir).

### 6. Jalankan aplikasi

```bash
npm run dev
```

Buka http://localhost:3000. Belum login → diarahkan ke `/masuk`.

| Halaman | Rute |
|---|---|
| Masuk | `/masuk` |
| Daftar | `/daftar` |
| Transaksi | `/transaksi` |
| Kategori | `/kategori` |
| Import mutasi & rekonsiliasi | `/import` |

### 7. Jalankan test

```bash
npm run test        # unit test (Vitest)
npm run test:e2e    # e2e test (Playwright)
```

Sebelum `npm run test:e2e` pertama kali:

```bash
npx playwright install chromium
```

Test e2e butuh project Supabase yang sudah dimigrasi dan **Confirm email** sudah dimatikan.

### 8. Pasang MCP Supabase ke Project Kamu

Selain MCP yang diminta FRD pilihanmu, **pasang juga MCP Supabase** dan sambungkan ke project Supabase yang kamu buat di langkah 2. Ini yang bikin agent bisa baca skema, jalanin migrasi, cek RLS, dan baca log error langsung — tanpa kamu bolak-balik ke dashboard.

Caranya di Antigravity:

1. Buka **MCP Store** → cari **Supabase** → Install
2. Saat diminta, arahkan ke project kamu sendiri (`project-ref` ada di Project URL, bagian sebelum `.supabase.co`)
3. Selesaikan proses authenticate-nya
4. Minta agent menyebutkan tool apa saja yang tersedia, untuk memastikan sambungannya hidup

> **Arahkan ke project kamu sendiri, jangan project orang lain.** Semua migrasi, seed, dan perubahan skema yang kamu lakukan akan mengenai database itu.

Repo ini sengaja **tidak** membawa file konfigurasi MCP apa pun, supaya credential-mu tidak pernah ikut ter-commit.

### 9. Skill Supabase yang Sudah Terpasang

`.agents/skills/` sudah berisi dua Skill resmi dari Supabase:

| Skill | Isinya |
|---|---|
| `supabase` | Database, Auth, Edge Functions, Realtime, Storage, CLI, dan cara pakai MCP server-nya |
| `supabase-postgres-best-practices` | RLS, index, pagination, locking, dan tuning query Postgres |

Keduanya dibaca otomatis oleh Antigravity. Isinya panduan umum Supabase — tidak terikat ke project siapa pun, jadi tetap relevan setelah MCP-mu diarahkan ke project sendiri.

**Ini bukan Skill tugasmu, dan jangan diubah.** Skill yang kamu buat ditaruh sebagai folder baru di sampingnya:

```
.agents/skills/
├── supabase/                         # bawaan
├── supabase-postgres-best-practices/ # bawaan
└── fitur-<nama-fiturmu>/             # punyamu
    └── SKILL.md
```

### Yang Sudah Ada di Repo

| Bagian | Isi |
|---|---|
| Skema database | `users`, `categories`, `transactions` + RLS + trigger `updated_at` |
| Auth | Daftar dan masuk pakai email + password, proteksi rute di server |
| Kelola Kategori | Tambah, ubah nama, arsipkan, buka arsip |
| Transaksi | Tambah, ubah, soft delete, daftar urut tanggal terbaru |
| Helper | `lib/auth.ts`, `lib/format.ts`, `lib/date.ts`, `lib/api.ts` |

Magic link, OAuth, reset password, dashboard, dan analitik **sengaja belum ada** — itu bagian dari FRD.

---

## Konsepnya

FRD di sini menjelaskan **apa yang harus dibangun** dengan jelas. Tapi, sama kayak project beneran, nggak semua kondisi khusus ditulis. Contohnya: kalau ada jadwal tanggal 31, bulan yang cuma 30 hari gimana? FRD nggak jawab. Kamu yang mikir dan mutusin.

Tantangannya ada di tiga hal:

1. **Nemuin kondisi yang belum dijawab FRD**, lalu mutusin sendiri, bukan ngikut tebakan agent.
2. **Multi-MCP.** Tiap fitur butuh 2–3 MCP yang kerja bareng: ambil desain, bikin resource di layanan luar, baca error, ukur performa, sampai buka PR.
3. **Bukti.** Fitur dianggap selesai kalau semua poin di **Verifikasi via MCP** ada buktinya.

## Tentang `decisions.md`

Ini catatan semua keputusanmu untuk hal-hal yang nggak ditulis di FRD. Fungsinya:

- Jadi bahan Skill, supaya agent ngerjain sesuai keputusanmu, bukan nebak.
- Jadi jejak yang bisa dibaca orang lain: kondisi apa yang kamu temukan, kamu putuskan apa, dan kenapa.
- Jadi acuan bukti: tiap keputusan harus kelihatan di kode atau hasil uji.

Pakai template `templates/decisions.md`, simpan di root branch kamu.

## Langkah

1. Clone repo, bikin branch `frd-XX-namakamu`, jalankan `npm install` dan `npm run dev`.
2. Baca FRD pilihanmu. Tulis `decisions.md` **sebelum** ngoding. Boleh pakai `/grill-me` buat nyari yang kelewat, tapi keputusannya tetap dari kamu.
3. Masukkan `docs/00-PRD-expense-tracker.md` ke **Rules** (scope Workspace).
4. Gabungkan FRD + `decisions.md` jadi **Skill** di `.agents/skills/<nama-fitur>/SKILL.md`.
5. Pasang semua MCP yang disebut di FRD. Cek MCP Store dulu, kalau nggak ada pasang manual. Credential jangan di-commit.
6. Atur mode akses dan pagar keamanan sebelum agent mulai kerja.
7. Bangun fiturnya. Bebas pakai `/plan`, `/goal`, subagent, atau `/browser`.
8. Kalau di tengah jalan nemu kondisi baru, tambahkan ke `decisions.md` dan Skill.
9. Kumpulkan bukti di folder `bukti/frd-XX/`, sesuai Verifikasi via MCP.

## Yang Di-push

- `decisions.md`
- `.agents/skills/<nama-fitur>/SKILL.md`
- Kode fitur
- Folder `bukti/frd-XX/`

## Daftar FRD

| No | Fitur | MCP | Tingkat |
|---|---|---|---|
| 01 | Langganan Premium & Billing | Stripe · Supabase · Resend | ★★★ |
| 02 | Onboarding Wizard dari Desain Figma | Figma · 21st.dev · Chrome DevTools | ★★ |
| 03 | Error Monitoring & Auto-Triage ke GitHub | Sentry · GitHub · Supabase | ★★★ |
| 04 | Sinkronisasi Laporan ke Notion Database | Notion · Supabase · Context7 | ★★ |
| 05 | Sinkronisasi Dua Arah Tagihan ↔ Google Calendar | Google Calendar · Supabase | ★★★ |
| 06 | Import & Rekonsiliasi Mutasi Bank | Supabase · Context7 · Chrome DevTools | ★★★ |
| 07 | Halaman Transaksi 100 Ribu Data | Supabase · Chrome DevTools | ★★★ |
| 08 | Feature Flag & A/B Test Form Transaksi | PostHog · Supabase · Chrome DevTools | ★★ |
| 09 | Email Ringkasan Mingguan Terjadwal | Resend · Supabase | ★★ |
| 10 | Auth Lengkap: Password, Magic Link, Google | Supabase · Chrome DevTools | ★★★ |
| 11 | Dompet Bersama dengan Undangan & Peran | Supabase · Resend · Chrome DevTools | ★★★ |
| 12 | Dashboard Analitik | 21st.dev · Supabase · Chrome DevTools | ★★ |
| 13 | Pipeline Preview per Pull Request | GitHub · Vercel · Supabase | ★★★ |
| 14 | Scan Struk Jadi Transaksi (AI Vision) | Supabase · Context7 · Chrome DevTools | ★★★ |
| 15 | Asisten Chat Keuangan | Supabase · Context7 · Sentry | ★★★ |

Semua FRD berdiri sendiri. Nggak ada FRD yang butuh FRD lain.

## Akun yang Dibutuhkan

| MCP | Yang perlu disiapkan |
|---|---|
| Supabase | Project Supabase sendiri (free tier cukup, kecuali disebut lain di FRD) |
| Stripe | Akun Stripe, **mode test** |
| Resend | Akun Resend + alamat email uji |
| Figma | Akun Figma + file desain (lihat FRD-02) |
| 21st.dev | API key 21st.dev Magic |
| Chrome DevTools | Chrome terpasang |
| Sentry | Akun Sentry (free tier) |
| GitHub | Repo milikmu + token dengan izin sesempit mungkin |
| Notion | Workspace Notion |
| Google Calendar | Akun Google dengan kalender uji |
| PostHog | Akun PostHog (free tier) |
| Vercel | Akun Vercel yang terhubung ke repo GitHub-mu |
| Context7 | Cek kebutuhan API key di dokumentasinya |

Nama dan jumlah tool tiap MCP bisa berubah. Sebelum mulai, minta agent menyebutkan tool apa saja yang tersedia dari MCP yang kamu pasang.
