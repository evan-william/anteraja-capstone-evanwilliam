# Puppeteer Shipment Regression

Hasil eksekusi: **10 PASS / 0 FAIL**, 10 skenario. Report ini dibuat dari test-results.json, bukan tabel hasil yang diketik manual.

## Test objective

Memastikan alur Shipment Form → Isi Data → Submit → Request History tetap bekerja pada aplikasi latihan PHP Day 13. Nomor resi, berat, jarak dan biaya harus sesuai input serta expected. Input invalid tidak boleh mengubah riwayat.

Baseline interaktif sudah dijalankan sebelum membuat runner: ANT-001 / 5 kg / 25 km muncul di riwayat dengan biaya Rp43.750. Lihat [catatan baseline](manual-baseline.md).

## Test scenarios dan expected vs actual

| Scenario | Expected | Actual | Status | Biaya aktual (Rp) |
|---|---|---|---|---:|
| Normal Shipment | SUCCESS | SUCCESS | PASS | 43750 |
| Missing Tracking | VALIDATION_ERROR | VALIDATION_ERROR | PASS | - |
| Invalid Weight | VALIDATION_ERROR | VALIDATION_ERROR | PASS | - |
| Long Distance Shipment | SUCCESS | SUCCESS | PASS | 215000 |
| Decimal Weight and Distance | SUCCESS | SUCCESS | PASS | 18250 |
| Zero Weight | VALIDATION_ERROR | VALIDATION_ERROR | PASS | - |
| Zero Distance | VALIDATION_ERROR | VALIDATION_ERROR | PASS | - |
| Whitespace Tracking Rejected by PHP | VALIDATION_ERROR | VALIDATION_ERROR | PASS | - |
| Weight Above Maximum | VALIDATION_ERROR | VALIDATION_ERROR | PASS | - |
| Weight at Maximum | SUCCESS | SUCCESS | PASS | 5000000000 |

Empat skenario SUCCESS dan enam penolakan input. Native HTML menolak resi kosong, berat negatif/nol, jarak nol, serta berat di atas maksimum. Resi berisi spasi lolos HTML required tetapi ditolak PHP dengan HTTP 422: ini menguji lapisan server, tanpa menonaktifkan validasi browser.

## Verification logic

SUCCESS harus menambah tepat satu row dengan resi/berat/jarak/biaya sesuai JSON dan pesan sukses yang menyebut resi. VALIDATION_ERROR harus memperlihatkan alasan yang sesuai serta riwayat identik sebelum/sesudah. Penolakan native juga harus menghasilkan nol POST; penolakan PHP harus berstatus 422, bukan HTTP 500 yang disalahartikan sebagai penolakan valid.

Screenshot hanya evidence. PASS/FAIL berasal dari assertion di verification.js. Self-check memberi expectedCost = 1 pada data ANT-001 yang sebenarnya menghasilkan 43750; hasilnya FAIL dan exit code 1. Enam unit test assertion serta 18 pemeriksaan PHP sumber juga dijalankan terpisah.

## Browser control dan waiting

Puppeteer 25.13.0; Node v22.14.0. Selector: #tracking-number, #weight, #distance, #shipment-request-form button[type="submit"], dan #request-history.

Runner memakai waitForSelector, waitForFunction untuk event invalid, serta Promise.all(waitForNavigation, click) untuk submit. Tidak ada delay acak sebagai penentu hasil. Polling 100 ms hanya untuk menunggu server siap, maksimal 10 detik. Context baru per scenario mencegah cookie/history bocor antar tes.

## Evidence

Setiap scenario memiliki dua PNG (20 total). SHA-256 dan ukuran masing-masing tersimpan di [evidence-manifest.json](evidence-manifest.json). JSON utama juga menyimpan input, reason, validation layer, historyBefore/historyAfter, biaya, durasi dan error runtime.

### Normal Shipment

[Form sebelum submit](automation-run/normal-shipment-form.png) · [Hasil setelah submit](automation-run/normal-shipment-result.png)

### Missing Tracking

[Form sebelum submit](automation-run/missing-tracking-form.png) · [Hasil setelah submit](automation-run/missing-tracking-result.png)

### Invalid Weight

[Form sebelum submit](automation-run/invalid-weight-form.png) · [Hasil setelah submit](automation-run/invalid-weight-result.png)

### Long Distance Shipment

[Form sebelum submit](automation-run/long-distance-form.png) · [Hasil setelah submit](automation-run/long-distance-result.png)

### Decimal Weight and Distance

[Form sebelum submit](automation-run/decimal-boundary-form.png) · [Hasil setelah submit](automation-run/decimal-boundary-result.png)

### Zero Weight

[Form sebelum submit](automation-run/zero-weight-form.png) · [Hasil setelah submit](automation-run/zero-weight-result.png)

### Zero Distance

[Form sebelum submit](automation-run/zero-distance-form.png) · [Hasil setelah submit](automation-run/zero-distance-result.png)

### Whitespace Tracking Rejected by PHP

[Form sebelum submit](automation-run/blank-tracking-server-form.png) · [Hasil setelah submit](automation-run/blank-tracking-server-result.png)

### Weight Above Maximum

[Form sebelum submit](automation-run/weight-over-limit-form.png) · [Hasil setelah submit](automation-run/weight-over-limit-result.png)

### Weight at Maximum

[Form sebelum submit](automation-run/weight-at-limit-form.png) · [Hasil setelah submit](automation-run/weight-at-limit-result.png)

## Regression result dan conclusion

Mulai: 2026-10-12T07:49:30.043Z. Selesai: 2026-10-12T07:49:38.635Z. Timestamp merupakan UTC dari eksekusi.

Alur latihan stabil untuk 10 skenario yang diuji pada versi ini. Tidak ada error JavaScript pada skenario tersebut. Ini bukan jaminan semua kemungkinan input atau seluruh capstone bebas bug.

Capstone Full, schema Supabase, akun demo dan data paket produksi tidak diubah. Salinan ShipmentRequest.php, submit-request.php dan perhitungan/validasinya mengikuti sumber Day 13; perubahan markup hanya menambahkan selector stabil.

## Git workflow

Branch: [feature/puppeteer-regression](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/puppeteer-regression). Lihat [bukti commit dan PR](git-workflow.json). Minimal tiga meaningful commits memisahkan runtime/app, runner/dataset/assertion, dan report/evidence/dokumentasi. Partner review tidak dilakukan sesuai instruksi pemilik; poin review partner pada rubrik tetap tidak terpenuhi, bukan dibuat seolah sudah approved.
