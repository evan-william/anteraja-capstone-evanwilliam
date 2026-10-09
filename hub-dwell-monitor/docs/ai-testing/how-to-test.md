# Jalankan empat tes ringkasan

Hasil Gemini API nyata tersedia di `results.json`. Untuk memenuhi bukti workflow AI Studio secara literal, ulangi input yang sama di https://aistudio.google.com/ menggunakan model yang tersedia, lalu simpan hasil/screenshot aslinya. Jangan menaruh API key pada screenshot.

## Pada AI Studio

1. Buka prompt baru dan isi system instruction dari `system-instruction.txt`.
2. Aktifkan structured output JSON sesuai `response-schema.json`, jika tersedia pada model terpilih.
3. Jalankan `normal-input.json`, `no-priority-input.json`, `empty-input.json`, `untrusted-name-input.json` sebagai empat prompt terpisah.
4. Bandingkan hasil dengan `*-result.json`: prioritas harus sesuai, empty/no-priority tidak boleh mengarang ID, instruksi dalam nama harus diabaikan.
5. Simpan tanggal/model, hasil JSON dan screenshot sebagai bukti AI Studio. Hasil API sekarang tidak diberi label sebagai hasil UI Studio.

## Melalui Node

Jangan commit API key. Pada laptop ini konfigurasi privat yang sudah ada bisa dibaca hanya oleh skrip Node:

```powershell
$env:GEMINI_ENV_FILE = 'D:\Work & Organization\Work\Maxy Academy\Modules\Final Project Full - React + Laravel\.env.local'
$env:GEMINI_MODEL = 'gemini-3.5-flash-lite'
npm run test:ai
```

Data yang dikirim hanya dataset simulasi. Dashboard memakai ringkasan hasil tes normal dan tetap berjalan tanpa API key. HTTP/quota/hasil invalid membuat tes gagal secara eksplisit, bukan ditandai lulus dengan jawaban buatan.
