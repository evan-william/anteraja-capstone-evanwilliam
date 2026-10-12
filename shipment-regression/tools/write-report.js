import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root } from './server.js';

const results = JSON.parse(await fs.readFile(path.join(root, 'test-results.json'), 'utf8'));
const summary = JSON.parse(await fs.readFile(path.join(root, 'run-summary.json'), 'utf8'));
const manifest = [];
for (const row of results) {
  for (const file of Object.values(row.evidence || {})) {
    const bytes = await fs.readFile(path.join(root, file));
    manifest.push({ file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  }
}
await fs.writeFile(path.join(root, 'docs/evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const table = results.map(row => `| ${row.scenario} | ${row.expected} | ${row.actual} | ${row.status} | ${row.actualCost ?? '-'} |`).join('\n');
const images = results.map(row => `### ${row.scenario}\n\n[Form sebelum submit](${row.evidence.form.replace('docs/', '')}) · [Hasil setelah submit](${row.evidence.result.replace('docs/', '')})\n`).join('\n');
const report = `# Puppeteer Shipment Regression

Hasil eksekusi: **${summary.pass} PASS / ${summary.fail} FAIL**, ${summary.total} skenario. Report ini dibuat dari test-results.json, bukan tabel hasil yang diketik manual.

## Test objective

Memastikan alur Shipment Form → Isi Data → Submit → Request History tetap bekerja pada aplikasi latihan PHP Day 13. Nomor resi, berat, jarak dan biaya harus sesuai input serta expected. Input invalid tidak boleh mengubah riwayat.

Baseline interaktif sudah dijalankan sebelum membuat runner: ANT-001 / 5 kg / 25 km muncul di riwayat dengan biaya Rp43.750. Lihat [catatan baseline](manual-baseline.md).

## Test scenarios dan expected vs actual

| Scenario | Expected | Actual | Status | Biaya aktual (Rp) |
|---|---|---|---|---:|
${table}

Empat skenario SUCCESS dan enam penolakan input. Native HTML menolak resi kosong, berat negatif/nol, jarak nol, serta berat di atas maksimum. Resi berisi spasi lolos HTML required tetapi ditolak PHP dengan HTTP 422: ini menguji lapisan server, tanpa menonaktifkan validasi browser.

## Verification logic

SUCCESS harus menambah tepat satu row dengan resi/berat/jarak/biaya sesuai JSON dan pesan sukses yang menyebut resi. VALIDATION_ERROR harus memperlihatkan alasan yang sesuai serta riwayat identik sebelum/sesudah. Penolakan native juga harus menghasilkan nol POST; penolakan PHP harus berstatus 422, bukan HTTP 500 yang disalahartikan sebagai penolakan valid.

Screenshot hanya evidence. PASS/FAIL berasal dari assertion di verification.js. Self-check memberi expectedCost = 1 pada data ANT-001 yang sebenarnya menghasilkan 43750; hasilnya FAIL dan exit code 1. Enam unit test assertion serta 18 pemeriksaan PHP sumber juga dijalankan terpisah.

## Browser control dan waiting

Puppeteer ${JSON.parse(await fs.readFile(path.join(root, 'package.json'))).devDependencies.puppeteer}; Node ${summary.node}. Selector: #tracking-number, #weight, #distance, #shipment-request-form button[type="submit"], dan #request-history.

Runner memakai waitForSelector, waitForFunction untuk event invalid, serta Promise.all(waitForNavigation, click) untuk submit. Tidak ada delay acak sebagai penentu hasil. Polling 100 ms hanya untuk menunggu server siap, maksimal 10 detik. Context baru per scenario mencegah cookie/history bocor antar tes.

## Evidence

Setiap scenario memiliki dua PNG (20 total). SHA-256 dan ukuran masing-masing tersimpan di [evidence-manifest.json](evidence-manifest.json). JSON utama juga menyimpan input, reason, validation layer, historyBefore/historyAfter, biaya, durasi dan error runtime.

${images}
## Regression result dan conclusion

Mulai: ${summary.startedAt}. Selesai: ${summary.finishedAt}. Timestamp merupakan UTC dari eksekusi.

${summary.fail === 0 ? 'Alur latihan stabil untuk 10 skenario yang diuji pada versi ini. Tidak ada error JavaScript pada skenario tersebut. Ini bukan jaminan semua kemungkinan input atau seluruh capstone bebas bug.' : 'Ada kegagalan; lihat reason dalam test-results.json. Workflow belum dapat dinyatakan stabil untuk skenario yang gagal.'}

Capstone Full, schema Supabase, akun demo dan data paket produksi tidak diubah. Salinan ShipmentRequest.php, submit-request.php dan perhitungan/validasinya mengikuti sumber Day 13; perubahan markup hanya menambahkan selector stabil.

## Git workflow

Branch: [feature/puppeteer-regression](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/puppeteer-regression). Lihat [bukti commit dan PR](git-workflow.json). Minimal tiga meaningful commits memisahkan runtime/app, runner/dataset/assertion, dan report/evidence/dokumentasi. Partner review tidak dilakukan sesuai instruksi pemilik; poin review partner pada rubrik tetap tidak terpenuhi, bukan dibuat seolah sudah approved.
`;
await fs.writeFile(path.join(root, 'docs/puppeteer-regression.md'), report);
console.log(`Report generated from ${results.length} executed scenarios; ${manifest.length} evidence images.`);
