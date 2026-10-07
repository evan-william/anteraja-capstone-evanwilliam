# Audit organisasi proyek — 7 Oktober 2026

Audit ini merapikan aplikasi Full React + Laravel tanpa mengubah requirement, schema, API, atau aturan bisnis. Notebook Python dan Big Data tetap menjadi tugas terpisah, bukan fitur aplikasi yang sudah terintegrasi.

## Backup

Salinan penuh sebelum perubahan berada di `Modules/Backups/React-Laravel-before-organization-2026-10-07`: 21.594 file, 508,65 MB, tanpa kegagalan atau mismatch pada penyalinan. Salinan mencakup dependency, Git, konfigurasi privat, dan data lokal. Jangan mengunggah backup ini karena mengandung credential.

Untuk rollback, hentikan server terlebih dahulu dan salin backup ke folder baru; jangan menimpa database Supabase atau menghapus perubahan setelah audit secara sembarang.

## Perubahan struktur

| Sebelumnya | Sekarang | Alasan |
| --- | --- | --- |
| `components/` | `frontend/components/` | Semua komponen browser berada di satu sumber frontend. |
| `lib/` | `frontend/lib/` | Helper/type tidak bercampur dengan kode server. |
| `templates/` | `docs/templates/` | Template keputusan bukan kode runtime. |
| `decisions.md` | `docs/product/finance-decisions.md` | Arsip Finance dibedakan dari keputusan produk terpadu. |
| Empat panduan runtime di root `docs/` | `docs/runtime/` | PHP mentor, migrasi Laravel, performa, dan Redis terkumpul. |
| `tools/qa-php-react.mjs` | `tools/qa-laravel-react.mjs` | Nama mencerminkan runtime yang diuji. |
| PNG sumber carousel dan dua varian logo di `public/` | `docs/design/source-assets/` | Enam aset yang tidak dimuat UI tidak ikut build; sumber desain tetap tersedia. |

`@/` diarahkan ke `frontend/` secara konsisten di TypeScript, Vite, dan Vitest. Import `@/frontend/...` dinormalisasi. Lint sekarang mencakup seluruh frontend, termasuk helper yang sebelumnya tidak tercakup. `components.json` menunjuk CSS Vite yang benar, bukan folder Next.js lama.

Enam file scaffold bawaan Laravel dihapus: `backend/package.json`, `backend/vite.config.js`, `backend/resources/js/app.js`, `backend/resources/js/bootstrap.js`, `backend/resources/css/app.css`, dan `backend/resources/views/welcome.blade.php`. Tidak ada route/controller yang merender welcome atau memakai entrypoint tersebut. Backend README bawaan diganti panduan proyek. `composer run dev` kini memakai launcher root; setup tidak menjalankan migrasi database bisnis dan memakai satu instalasi/build frontend root.

Salinan aset build lama di lima folder mirror `backend/public` dibersihkan dan dibuat ulang dari `dist` oleh `npm start`. File `index.php`, `.htaccess`, konfigurasi, dan data privat tidak disentuh. Enam aset sumber yang dipindahkan mengurangi isi salinan build sekitar 8 MB tanpa mengganti gambar aktif.

Folder Laravel berbasis konvensi, dependency, SQL, fixture, dan bukti historis tidak dihapus hanya karena tidak diimpor JSX. Alasannya dijelaskan di [peta struktur](PROJECT_STRUCTURE.md).

## Bukti penggunaan dan preservasi

- `npm run audit:usage`: 56 file sumber TypeScript/React seluruhnya terjangkau dari entrypoint, lazy import, atau test; tidak ada import lokal gagal, aset publik hilang, aset publik tanpa referensi, atau scaffold lama yang diperiksa tertinggal.
- `output/audit/source-usage.json`: edge import, entrypoint, dependency, dan referensi aset.
- `node tools/audit-preservation.mjs`: membandingkan sumber frontend, PHP aplikasi/routes/config/tests, SQL, PRD/FRD, dan aset aktif dengan backup. Perbedaan frontend yang diizinkan hanya prefix import dan satu class layout tabel Seller.
- `output/audit/graphify-out/`: snapshot struktur frontend sebelum pemindahan, cakupan parsial; bukan bukti seluruh dependency. Audit import TypeScript adalah sumber verifikasi setelah pemindahan.

Analisis statis membuktikan keterjangkauan file, bukan bahwa setiap cabang fungsi dijalankan setiap waktu. API, konfigurasi framework, dokumentasi, dan tooling mempunyai tujuan meskipun tidak semuanya dijalankan dalam satu sesi demo.

## Hasil pengujian

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript | Lulus setelah pemindahan. |
| ESLint seluruh frontend | Lulus. |
| Vitest | 59 test dalam 11 file lulus. |
| PHPUnit | 22 test / 88 assertion lulus; SQLite in-memory, bukan reset Supabase. |
| Build produksi | Lulus; dua warning annotation dari dependency Zod sudah ada sebelumnya. |
| `npm start` | Lulus pada port uji 3108; seluruh workflow browser tiga role diuji kembali melalui build produksi dan backend Laravel. |
| Browser dengan Supabase nyata | Login Admin/Seller/Konsumen, tracking valid/invalid, detail kiriman, tiket, asisten, Finance, preview CSV, kategori, dan penolakan akses lintas role lulus. |
| Regresi layout/interaksi | 41 pemeriksaan lulus: 12 halaman pada 375/768/1440px, favicon, gambar termuat, mount peta, carousel manual/reduced motion, navigasi keyboard, filter, export JSON/CSV, dan empty state. |
| Redis nyata | Cache hit pada pembacaan kedua; tidak ada SELECT kategori kedua; akun anonim tetap ditolak. |
| Browser runtime | Tidak ada `pageerror` pada dua rangkaian browser yang lulus. |

Screenshot hasil render ada di `output/organization-qa/screens/`; laporan workflow di `browser-workflows.txt` dan `responsive-workflows.json`. Screenshot login desktop dan tracking mobile diperiksa visual. Pemeriksaan lebar halaman lain memakai pengukuran DOM otomatis, bukan klaim peninjauan manual setiap screenshot.

Screenshot viewport tabel Seller mobile juga diperiksa setelah perbaikan. Hasil mode produksi disimpan di `output/organization-qa/production-workflows.txt`; daftar file yang berubah/dipindahkan relatif terhadap backup ada di `output/organization-qa/changed-files.txt`. Pemeriksaan file Git tidak menemukan `.env`, credential akun lokal, folder privat, atau pola secret API nyata ter-track.

Satu run tambahan Vitest pada filesystem sandbox yang sibuk mengalami timeout bootstrap PHP pada dua kasus; pengulangan dengan akses runtime normal lulus 59/59 tanpa menaikkan timeout, mengurangi assertion, atau mengubah logic test. Build terakhir tetap lulus.

Bug ditemukan: dashboard Seller pada 375px membuat dokumen melebar ke 600px karena elemen `sr-only` absolut di tabel tidak dibatasi containing block. Wrapper tabel diberi `relative`. Uji ulang lulus pada ketiga breakpoint; tabel masih dapat digeser horizontal dan filter/export tetap bekerja.

## Batas verifikasi

Schema, RLS, SQL, alur autentikasi, kontrak route, PRD, dan FRD dipertahankan. Tidak ada reset/migrasi/seed atau penyimpanan tiket/transaksi/impor pada Supabase yang dilakukan untuk audit ini. Mutasi bisnis tidak diuji dengan menulis ulang data demo; logic backend dibandingkan byte-per-byte dengan backup dan test yang ada dijalankan.

Peta, asisten, dan Supabase memerlukan layanan luar; balasan asisten yang berhasil tidak menjamin Gemini tersedia setiap waktu. Cache invalidasi file masih memerlukan permission storage yang benar; batas multi-instance dan kegagalan storage dijelaskan di [panduan Redis](../runtime/REDIS.md). Audit ini tidak mengklaim semua kemungkinan outage atau setiap workflow produksi bebas bug.

Tidak ada commit/push otomatis pada penataan ini. Perubahan lokal Redis/performa yang sudah ada sebelum audit tetap dipertahankan.
