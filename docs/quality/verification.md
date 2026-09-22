# Verifikasi Day 5

## Hasil pemeriksaan

| Pemeriksaan | Hasil |
|---|---|
| TypeScript `tsc --noEmit` | Lulus |
| ESLint pada file aplikasi, komponen, library, dan test | Lulus |
| Vitest | 37/37 test lulus, termasuk empat aturan risiko tracking |
| Next.js production build | Lulus; seluruh route tracking, seller, Finance, dan API terdeteksi |
| Tracking desktop 1440 × 1000 | Hero, form, konten, dan kartu dirender tanpa tabrakan |
| Tracking mobile 390 × 844 | Header, hero, form, dan konten tersusun responsif |
| Format desain | Enam file `.webp` |
| Kredensial | `.env.example` hanya berisi placeholder |
| SQL database | Migration, seed, verify, smoke test, dan relation query tersedia; penerapan remote mengikuti `DATABASE_RUN.md` |
| Integritas shipment | Composite FK, global AWB, risk trigger, access code, RLS, RPC atomik, dan outbox terdokumentasi |

## Bukti repositori

- `evidence/branch-5-ui.webp`: branch `5-ui` pada repository peserta.
- `evidence/design-files-5-ui.webp`: isi folder desain pada branch `5-ui`.
- `designs/01-dashboard-settlement.webp` sampai `06-preview-mobile.webp`: hasil render antarmuka.

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/lacak`, lalu gunakan `ANT-100015` dan kode `260926`. Masuk sebagai seller melalui `/masuk` menggunakan `demo@contoh.test` / `demo12345`.

Catatan: production build diverifikasi memakai output sementara `.next-verify` karena folder `.next` lokal sedang dipakai preview. Folder sementara sudah dihapus setelah pemeriksaan.
