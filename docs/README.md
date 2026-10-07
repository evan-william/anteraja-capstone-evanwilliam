# Dokumentasi proyek

Gunakan panduan runtime untuk menjalankan aplikasi, peta struktur untuk mencari kode, dan PRD/FRD untuk membaca requirement. Dokumen pengumpulan tugas bukan petunjuk runtime terbaru.

## Panduan aktif

- [Cara menjalankan React + Laravel](../LARAVEL_RUN.md).
- [Peta folder dan lokasi edit](architecture/PROJECT_STRUCTURE.md).
- [Audit penggunaan dan perubahan struktur](architecture/ORGANIZATION_AUDIT.md).
- [Optimasi dan pengukuran API](runtime/PERFORMANCE.md).
- [Cache Redis dan fallback](runtime/REDIS.md).
- [Migrasi backend ke Laravel](runtime/LARAVEL_MIGRATION.md).
- [Penerapan modul mentor PHP](runtime/PHP_MENTOR_GUIDE.md).

## Requirement dan desain

- [PRD terpadu](product/prd.md) dan [FRD terpadu](product/frd.md).
- [Keputusan produk](product/decisions.md).
- [Keputusan Finance awal](product/finance-decisions.md): arsip keputusan FRD-06; catatan teknologi lama bukan konfigurasi runtime sekarang.
- [Panduan role](product/RBAC_GUIDE.txt), [rencana RBAC](product/RBAC_ROLE_PLAN.txt), dan [verifikasi RBAC](product/RBAC_VERIFICATION.txt).
- [Asisten operasi](product/ADMIN_ASSISTANT.md).
- [Desain UI](design/ui-design.md), [prototype dan pemetaan FRD](prototype/README.md), [foto kota](prototype/CITY_PHOTOS.md), dan [peta](prototype/ROUTE_MAP.md).
- [Setup SQL](../database/DATABASE_RUN.md) dan [ERD](../database/ERD.md).

## Data contoh, bukti, dan arsip

`data/` berisi CSV contoh untuk preview rekonsiliasi dan pengujian. `quality/` berisi laporan dan screenshot verifikasi terdahulu. Hasil pemeriksaan baru berada di `../output/organization-qa/`.

`submissions/` menyimpan bukti pengumpulan Day 5/7/8 beserta commit dan screenshot asli. Nama file/teknologi di dalam dokumen historis mencerminkan kondisi saat tugas dikerjakan; jangan menjadikannya petunjuk lokasi kode terbaru. `templates/` menyediakan format keputusan untuk pekerjaan berikutnya, bukan kode yang dijalankan aplikasi.

Tugas notebook Python dan Big Data tetap terpisah di `Modules/Daily Module`, bukan dipindahkan atau ditambahkan ke backend saat audit ini.
