# Traceability FRD-06 dan Instruksi Tugas

Dokumen ini menghubungkan setiap instruksi dengan implementasi atau bukti yang dapat diperiksa.

## Functional requirements

| ID | Status | Implementasi / bukti |
|---|---|---|
| FR-06-01 — unggah CSV Bank A/B | Lulus lokal | `components/import/import-manager.tsx`; kedua file asli diuji di `tests/unit/import-parser.test.ts` |
| FR-06-02 — deteksi format dari isi | Lulus lokal | `detectBankFormat()`; test nama file tidak digunakan |
| FR-06-03 — halaman tidak freeze | Lulus MCP | Papa Parse Web Worker; `performance-50000.json` dan screenshot |
| FR-06-04 — preview Baru/Cocok/Error | Lulus lokal | parser, matching, endpoint preview, tabel preview |
| FR-06-05 — kategori untuk Baru | Lulus lokal | pilihan kategori per baris; server dan database memvalidasi kategori |
| FR-06-06 — aturan keyword | Lulus lokal | longest-keyword/oldest-rule; tersimpan atomik bersama import |
| FR-06-07 — simpan Baru dan tautkan Cocok | Lulus lokal; live pending | fungsi atomik `save_bank_import`; verifikasi live dicatat setelah Supabase aktif |
| FR-06-08 — riwayat dan Batalkan | Lulus lokal; live pending | halaman riwayat dan `cancel_bank_import`; verifikasi live dicatat setelah Supabase aktif |

## Acceptance criteria

| Skenario | Status | Bukti |
|---|---|---|
| Bank A dapat diimpor | Parser lulus; database live pending | 10 baris transaksi: 6 valid, 4 Error karena pecahan rupiah yang dilarang PRD |
| Bank B dapat diimpor | Parser lulus; database live pending | 11/11 baris valid, termasuk tanggal non-padded dan deskripsi kosong |
| Transaksi manual yang sama menjadi Cocok | Lulus unit; live pending | matching exact satu-ke-satu di `import-matching.test.ts` |
| Batalkan hanya menghilangkan transaksi import | Implementasi selesai; live pending | fungsi hanya menyentuh `created_transaction_id`, bukan `matched_transaction_id` |

## Langkah tugas dari PDF

| Langkah | Status |
|---|---|
| Fork repo ke akun peserta | Selesai — `evan-william/expense-tracker-casestudy` |
| Clone fork dan `npm install` | Selesai |
| Project Supabase sendiri, `.env.local`, migrasi, seed, register | Menunggu autentikasi Supabase live |
| Branch `frd-XX-namakamu` | Selesai — `frd-06-evanwilliam` |
| Pilih dan baca satu FRD penuh | Selesai — FRD-06 |
| Salin template dan tulis `decisions.md` sebelum kode | Selesai; 17 keputusan dan bukti |
| PRD sebagai Workspace Rule | Selesai — `.agents/rules/expense-tracker.md` |
| Skill gabungan FRD + keputusan | Selesai dan tervalidasi — `.agents/skills/fitur-import-mutasi/SKILL.md` |
| MCP Supabase, Context7, Chrome DevTools | Terpasang di Codex dan config Antigravity; Supabase OAuth live pending |
| Bukti di `bukti/frd-06/` | Selesai untuk Context7, Chrome, test/build; Supabase live pending |
| Push branch dan PR ke upstream `main` | Menunggu verifikasi live final |

## Quality gates

- Unit test: 33/33 lulus setelah assertion jumlah/status kedua file contoh ditambahkan.
- ESLint: lulus.
- TypeScript strict: lulus.
- Production build: lulus.
- Skill validator: lulus.
- Tidak ada `.env`, token, atau konfigurasi MCP lokal di Git.
