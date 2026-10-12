# Shipment Regression

Jalankan regresi Shipment Request dengan satu runner Puppeteer dan beberapa skenario JSON. Runner membuka form, submit, memeriksa riwayat, mengambil screenshot, lalu menghasilkan PASS/FAIL otomatis.

- **Data-driven:** 10 skenario, termasuk happy path, resi kosong, dan berat negatif.
- **Assertion:** bandingkan status, resi, berat, jarak, biaya, dan perubahan riwayat.
- **Isolasi:** setiap skenario memakai context/session baru; tidak menulis ke Supabase.
- **Evidence:** dua screenshot per skenario serta JSON hasil eksekusi.

## Mulai

Butuh Node.js 22.12+, npm, Chrome desktop, dan PHP 8.2+. Puppeteer memakai Chrome yang sudah terpasang; instalasi tidak mengunduh browser tambahan.

```powershell
cd "D:\Work & Organization\Work\Maxy Academy\Modules\Daily Module\Day 21 - Demo Day\Tugas\repository\shipment-regression"
npm ci
npm test
```

Runner menjalankan PHP lokal pada port 3122, melakukan 10 skenario, lalu menutup browser/server miliknya. Hasilnya ada di `test-results.json`; screenshot di `docs/automation-run/`.

## Perintah lain

```powershell
npm run test:headed
npm run test:unit
npm run test:self-check
npm start
```

`test:headed` memperlihatkan Chrome. `test:unit` memeriksa assertion. `test:self-check` sengaja memberi expected biaya yang salah dan memastikan runner menghasilkan FAIL serta exit code 1; tidak menimpa report utama. `npm start` membuka app latihan di http://127.0.0.1:3121/shipment-form.html; Ctrl+C menghentikannya.

## Konfigurasi opsional

| Variabel | Kegunaan | Default |
|---|---|---|
| `PHP_BIN` | Path PHP executable | `C:/xampp/php/php.exe` jika tersedia, selain itu `php` di PATH |
| `CHROME_PATH` | Path Chrome jika deteksi channel tidak berhasil | Chrome stable terpasang |
| `APP_PORT` | Port server yang dijalankan runner | 3122; `npm start` menggunakan 3121 |
| `BASE_URL` | Pakai app latihan yang sudah berjalan, tanpa memulai/mematikan server itu | Tidak diisi; hanya host lokal diizinkan |

Tidak memerlukan `.env`, key, akun, database, Docker, atau login bank. Jangan arahkan runner ke capstone produksi: alur latihan ini berbeda dari tracking publik.

## Tambah skenario

Edit `tests/shipment-test-data.json`. Gunakan ID unik dan isi tracking/weight/distance/expected. SUCCESS juga memerlukan `expectedCost` yang dihitung independen; VALIDATION_ERROR memerlukan layer dan alasan validasi. Jalankan kembali `npm test`, lalu periksa JSON, bukan screenshot saja.

## Struktur dan sumber

- `app/`: salinan latihan PHP OOP/Form/Session Day 13; aturan tarif dan validasi dipertahankan.
- `tests/shipment-regression.js`: satu alur reusable untuk seluruh dataset.
- `tests/verification.js`: validasi dataset dan assertion expected vs actual.
- `tests/verification.test.js`: tes assertion, termasuk perlindungan terhadap false PASS.
- `tools/server.js`: menjalankan PHP serta memeriksa kesiapan dengan HTTP polling terbatas.
- `tools/write-report.js`: membuat laporan Markdown dari hasil nyata.
- `tools/create_submission.py`: membuat PDF dari JSON/screenshot; memerlukan Python, ReportLab, dan Pillow hanya untuk regenerasi PDF, bukan menjalankan tes.
- [Baseline interaktif](docs/manual-baseline.md), [laporan regresi](docs/puppeteer-regression.md).

Perubahan app hanya hook DOM: `#tracking-number`, `#shipment-request-form`, dan penanda tabel riwayat. Browser tools menjalankan baseline sebelum runner dibuat; baseline bukan klaim klik manual oleh Evan. Riwayat tersimpan dalam PHP session, bukan database permanen atau paket logistik sungguhan.

## Git dan batas verifikasi

Branch: [feature/puppeteer-regression](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/puppeteer-regression). Bukti commit serta status PR ada di [git-workflow.json](docs/git-workflow.json). Partner review tidak dilakukan sesuai arahan pemilik proyek; tidak dilaporkan sebagai review yang sudah lulus.

PASS hanya membuktikan skenario yang dijalankan pada versi ini. Ia tidak menjamin seluruh aplikasi bebas bug. Kegagalan setup, navigasi, assertion, atau error JavaScript menghasilkan FAIL/exit code nonzero.

Kode mengikuti ketentuan repository induk; tugas ini tidak menetapkan lisensi baru.
