# Pengumpulan Day 7 - Prototype

## Branch

[Branch `7-prototype`](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/7-prototype)

## Bukti antarmuka

PDF memuat 25 screenshot: 19 bukti implementasi dan state UI, ditambah 6 layar pendukung untuk settlement, upload, preview rekonsiliasi, riwayat pembatalan, rincian shipment, dan tampilan mobile. Screenshot `fr-trk-05-action-required.webp` tetap disediakan sebagai bukti utama TRK-05 pada hasil tracking `ANT-100015`.

## Checklist penilaian

| Kriteria | Implementasi |
|---|---|
| Halaman sesuai PRD/FRD | 9 rute utama dipetakan pada `docs/prototype/PAGE_FRD_MAPPING.md` |
| Halaman saling terhubung | Navigasi publik, navigasi seller, link detail, dan anchor tindakan |
| Semantic HTML | `main`, `section`, `article`, `header`, `nav`, `aside`, form, dan tabel native |
| JSON-LD | `WebApplication` pada `/lacak`, mengikuti `https://schema.org/WebApplication` |
| Responsif | Mobile-first dari 320 px, tabel scroll, navigation mobile, breakpoint hingga xl |
| Selector JS/jQuery | ID dan class `js-*` didokumentasikan dalam `SELECTOR_REFERENCE.md` |
| Commit modular | Melebihi syarat minimal lima commit pada branch `7-prototype` |

## Berkas LMS

Upload `output/pdf/day7-prototype-report.pdf`. PDF memuat link branch, peta halaman ke FRD, seluruh screenshot UI yang tersedia, serta bukti implementasi teknis.
