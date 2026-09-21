# Verifikasi Day 5

## Hasil pemeriksaan

| Pemeriksaan | Hasil |
|---|---|
| TypeScript `tsc --noEmit` | Lulus |
| ESLint pada file aplikasi, komponen, library, dan test | Lulus |
| Vitest | 33/33 test lulus |
| Next.js production build | Lulus; route `/ui-preview` terdeteksi |
| Desktop 1440 × 1000 | Enam layar dirender tanpa tabrakan konten |
| Mobile 390 × 844 | Hierarki tetap terbaca; tabel dapat digulir horizontal |
| Format desain | Enam file `.webp` |
| Kredensial | `.env.example` hanya berisi placeholder |

## Bukti repositori

- `evidence/branch-5-ui.webp`: branch `5-ui` pada repository peserta.
- `evidence/design-files-5-ui.webp`: isi folder desain pada branch `5-ui`.
- `designs/01-dashboard-settlement.webp` sampai `06-preview-mobile.webp`: hasil render antarmuka.

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/ui-preview?screen=dashboard`. Ganti nilai `screen` dengan `upload`, `preview`, `history`, atau `shipment` untuk melihat layar lain.
