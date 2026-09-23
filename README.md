# Anteraja Tracking & Operations

Capstone ini mengubah tracking dari daftar status pasif menjadi alur yang memberi kepastian dan jalan keluar. Penerima dapat memahami risiko, memperbarui petunjuk alamat, mengatur jadwal atau safe drop, membuat tiket CS berkonteks, dan memilih notifikasi. Seller mendapat control tower; Finance/Rekonsiliasi FRD-06 tetap tersedia sebagai modul pendukung yang menghubungkan resi, COD, settlement, dan mutasi bank.

## Jalankan

```bash
npm install
cp .env.example .env.local
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
npx supabase db reset
npm run dev
```

Isi `.env.local` dengan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jangan commit credential.

Demo: buka `http://localhost:3000/lacak`, gunakan resi `ANT-100015` dan kode `260926`. Ruang seller memakai `demo@contoh.test` / `demo12345`.

Ada 300 resi fiktif tambahan (`ANT-200001`–`ANT-200300`) di `supabase/seed-demo-shipments.sql`. Jalankan setelah seed dasar pada database demo; panduan contoh resi ada di `docs/prototype/DEMO_SHIPMENTS.md`.

Detail kiriman kini memiliki [peta perjalanan](docs/prototype/ROUTE_MAP.md) yang menampilkan jalur jalan perkiraan. Untuk produksi, konfigurasi `ROAD_ROUTER_URL` ke router OSRM ber-SLA; tanpa konfigurasi, aplikasi menggunakan layanan demo publik dan tetap menampilkan titik kota/hub saat layanan rute tidak tersedia.

| Area | Rute | Fungsi |
|---|---|---|
| Tracking publik | `/lacak` | Cari resi dengan kode akses |
| Detail tracking | `/lacak/[awb]` | Timeline, risiko, resolusi, notifikasi, tiket CS |
| Operasi seller | `/pengiriman` | Filter, pencarian, ekspor CSV/JSON |
| Finance | `/transaksi` | Arus dana settlement dan biaya |
| Rekonsiliasi | `/import` | Preview/simpan/batal impor FRD-06 |
| Kategori | `/kategori` | Klasifikasi keuangan |

Next.js menangani UI/API. Supabase menyediakan Auth, PostgreSQL, RLS, dan RPC atomik. Tracking publik memeriksa kode akses, memasking PII, dan dibatasi 10 request/IP/menit. Action menulis resolution, event, dan integration outbox dalam satu transaksi. Outbox menjadi batas aman untuk integrasi kurir, CS, WhatsApp, email, atau push; demo tidak mengklaim memakai API internal Anteraja.

## Pemeriksaan

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Dokumen: [PRD terpadu](docs/product/prd.md), [FRD terpadu](docs/product/frd.md), [keputusan produk](docs/product/decisions.md), [desain UI](docs/design/ui-design.md), [dokumentasi prototype](docs/prototype/README.md), [pemetaan halaman ke FRD](docs/prototype/PAGE_FRD_MAPPING.md), [selector JavaScript/jQuery](docs/prototype/SELECTOR_REFERENCE.md), [setup database](database/DATABASE_RUN.md), dan [ERD](database/ERD.md).
