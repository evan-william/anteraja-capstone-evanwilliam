---
name: fitur-import-mutasi
description: Implement and verify FRD-06 bank-statement CSV import, reconciliation, category rules, import history, and cancellation in this Expense Tracker repository.
---

# Import dan Rekonsiliasi Mutasi Bank

Gunakan skill ini hanya untuk FRD-06. Baca `docs/frd/FRD-06-import-rekonsiliasi.md`, `docs/00-PRD-expense-tracker.md`, dan `decisions.md` sebelum mengubah kode.

## Hasil yang wajib

- Pengguna terautentikasi dapat mengunggah kedua file contoh di `docs/data/`.
- Format dideteksi dari isi, bukan nama file.
- Preview memberi status Baru, Cocok, atau Error untuk setiap baris transaksi.
- Baris Baru dapat diberi kategori dan dapat menyimpan aturan keyword.
- Simpan membuat transaksi Baru dan menautkan transaksi Cocok secara atomik.
- Riwayat menampilkan waktu, nama file, jumlah status, dan aksi Batalkan import.
- Batalkan hanya men-soft-delete transaksi yang dibuat oleh import tersebut.

## Parser

- Gunakan `papaparse` versi 5.7.0. Dokumentasi dipilih melalui Context7 library `/mholt/papaparse`.
- Parsing file di browser wajib memakai `worker: true`.
- Batasi file 10 MB dan maksimal 50.000 baris transaksi.
- Bank A memakai delimiter titik koma setelah empat baris metadata; Bank B memakai header CSV standar.
- Jangan gunakan `dynamicTyping` untuk uang. Parse nominal dari string menjadi integer secara eksplisit.
- Hapus BOM asli atau prefix literal `\\xef\\xbb\\xbf` hanya pada awal file.
- Terapkan seluruh aturan normalisasi, pecahan rupiah, duplikat, dan tanggal dari `decisions.md`.

## Pencocokan

- Bandingkan tanggal, nominal, jenis kategori, dan deskripsi normal secara exact.
- Konsumsi kandidat satu-ke-satu dalam urutan `created_at`, lalu `id`.
- Gunakan fingerprint dengan occurrence index agar duplikat identik tetap merupakan dua baris terpisah.
- Jangan percaya status dari browser saat simpan; database harus memvalidasi ulang user, kategori, dan transaksi target.

## Database dan keamanan

- Ikuti pola migrasi imperatif repo.
- Tabel baru memakai UUID, `created_at`, `updated_at`, `user_id`, grant eksplisit, dan RLS terpisah untuk select/insert/update/delete.
- Policy memakai `(select auth.uid()) = user_id` dan indeks dengan `user_id` sebagai kolom pertama.
- Foreign key selalu diindeks bila belum tercakup indeks komposit yang sesuai.
- Simpan dan batalkan melalui fungsi database atomik `security definer` yang mengunci `search_path`, memvalidasi `auth.uid()` serta seluruh foreign key milik user, dan hanya memberi execute ke `authenticated`; jangan memberi client hak tulis tabel atau memakai secret/service-role di browser.
- Batalkan idempotent dan tidak boleh menghapus transaksi manual.

## UI dan API

- Tempatkan halaman di `app/import/`, komponen di `components/import/`, route di `app/api/v1/imports/`, dan helper di `lib/import/`.
- UI menggunakan bahasa Indonesia, dapat dipakai dengan keyboard, menampilkan error per baris, dan memaginasi preview 100 baris.
- Semua route memanggil helper autentikasi repo (`getCurrentUser()` atau `requireCurrentUser()`) dan mengembalikan kontrak API PRD.
- Jangan mengirim raw credential atau isi `.env*` ke client, log, bukti, atau commit.

## Verifikasi

- Unit test: kedua parser, nominal/tanggal invalid, duplikat, fingerprint, matching satu-ke-satu, dan aturan keyword.
- Integration/API test: validasi payload serta kategori wajib untuk Baru.
- E2E: impor Bank A, Bank B, pencocokan manual, dan batalkan import.
- MCP Supabase: simpan bukti jumlah/isi transaksi sebelum, sesudah simpan, dan sesudah batalkan.
- MCP Context7: simpan hasil resolve dan query dokumentasi Papa Parse.
- Chrome DevTools MCP: rekam parsing 50.000 baris dan simpan durasi serta bukti halaman tetap responsif.
- Jalankan `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, dan E2E bila kredensial Supabase tersedia.

## Dilarang

- Jangan membulatkan nominal pecahan rupiah.
- Jangan menganggap nama file menentukan bank.
- Jangan merender 50.000 baris sekaligus.
- Jangan menyimpan sebagian import bila satu operasi database gagal.
- Jangan menghapus atau mengubah transaksi manual saat membatalkan import.
- Jangan mengubah dua Skill Supabase bawaan repo.
