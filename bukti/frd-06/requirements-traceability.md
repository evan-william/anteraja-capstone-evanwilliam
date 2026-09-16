# Traceability FRD-06 dan Instruksi Tugas

Dokumen ini menghubungkan setiap instruksi dengan implementasi atau bukti yang dapat diperiksa.

## Functional requirements

| ID | Status | Implementasi / bukti |
|---|---|---|
| FR-06-01 — unggah CSV Bank A/B | Lulus live | Kedua file asli berhasil melalui UI pada `tests/e2e/import-mutasi.spec.ts` |
| FR-06-02 — deteksi format dari isi | Lulus lokal | `detectBankFormat()`; test nama file tidak digunakan |
| FR-06-03 — halaman tidak freeze | Lulus MCP | Papa Parse Web Worker; `performance-50000.json` dan screenshot |
| FR-06-04 — preview Baru/Cocok/Error | Lulus live | parser, matching, endpoint preview, dan tabel preview diuji browser |
| FR-06-05 — kategori untuk Baru | Lulus live | kategori dipilih per baris; server dan database memvalidasi kategori |
| FR-06-06 — aturan keyword | Lulus lokal | longest-keyword/oldest-rule; tersimpan atomik bersama import |
| FR-06-07 — simpan Baru dan tautkan Cocok | Lulus live | fungsi atomik `save_bank_import`; `supabase-after-import.json` dan E2E |
| FR-06-08 — riwayat dan Batalkan | Lulus live | `supabase-after-cancel.json` membuktikan transaksi import hilang dan manual tetap ada |

## Acceptance criteria

| Skenario | Status | Bukti |
|---|---|---|
| Bank A dapat diimpor | Lulus live | 10 baris: 6 valid, 4 Error karena pecahan rupiah; disimpan dan dibatalkan via UI |
| Bank B dapat diimpor | Lulus live | 11/11 valid, termasuk tanggal non-padded dan deskripsi kosong; disimpan dan dibatalkan via UI |
| Transaksi manual yang sama menjadi Cocok | Lulus live | matching satu-ke-satu diuji unit dan browser terhadap transaksi manual |
| Batalkan hanya menghilangkan transaksi import | Lulus live | `active_import_created: 0` dan `active_manual_grab_food: 1` pada bukti MCP |

## Langkah tugas dari PDF

| Langkah | Status |
|---|---|
| Fork repo ke akun peserta | Selesai — `evan-william/expense-tracker-casestudy` |
| Clone fork dan `npm install` | Selesai |
| Project Supabase sendiri, `.env.local`, migrasi, seed, Auth | Selesai — project `rfkcbmacwlknowskdwbf`; migrasi/seed dan login demo tervalidasi |
| Branch `frd-XX-namakamu` | Selesai — `frd-06-evanwilliam` |
| Pilih dan baca satu FRD penuh | Selesai — FRD-06 |
| Salin template dan tulis `decisions.md` sebelum kode | Selesai; 18 keputusan dan bukti |
| PRD sebagai Workspace Rule | Selesai — `.agents/rules/expense-tracker.md` |
| Skill gabungan FRD + keputusan | Selesai dan tervalidasi — `.agents/skills/fitur-import-mutasi/SKILL.md` |
| MCP Supabase, Context7, Chrome DevTools | Selesai; ketiganya terhubung dan menghasilkan bukti live |
| Bukti di `bukti/frd-06/` | Selesai untuk Supabase, Context7, Chrome, unit, build, dan E2E |
| Push branch dan PR ke upstream `main` | Branch sudah dipush; PR dibuat setelah quality gate final |

## Quality gates

- Unit test: 33/33 lulus setelah assertion jumlah/status kedua file contoh ditambahkan.
- ESLint: lulus.
- TypeScript strict: lulus.
- Production build: lulus.
- Playwright E2E cloud: 2/2 lulus.
- Skill validator: lulus.
- Tidak ada `.env`, token, atau konfigurasi MCP lokal di Git.
