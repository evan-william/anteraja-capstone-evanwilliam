# FRD-06 — Import & Rekonsiliasi Mutasi Bank

| | |
|---|---|
| **MCP** | Supabase · Context7 · Chrome DevTools |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-import-mutasi` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna mengunggah file mutasi bank dari 2 bank berbeda. Aplikasi menampilkan preview, mencocokkan baris dengan transaksi yang sudah dicatat manual, lalu menyimpannya.

## 2. User Story
> Sebagai pengguna yang mencatat manual tapi sering lupa, saya ingin mengimpor mutasi bank dan melihat mana yang sudah tercatat dan mana yang belum.

## File Contoh
`docs/data/mutasi-bank-a.csv` dan `docs/data/mutasi-bank-b.csv`. Keduanya wajib bisa diimpor.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Supabase | Membuat tabel pendukung, proses simpan, dan query verifikasi sebelum/sesudah import. | Query jumlah transaksi di tiap tahap |
| Context7 | Mengambil dokumentasi library parser CSV yang dipilih. | Library & versi tercatat di Skill |
| Chrome DevTools | Mengukur performa parsing file besar di browser. | Rekaman performa |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-06-01 | Pengguna mengunggah file CSV dari Bank A atau Bank B. |
| FR-06-02 | Aplikasi mengenali format bank dari isi file. |
| FR-06-03 | Parsing tidak membuat halaman freeze. |
| FR-06-04 | Preview menampilkan setiap baris dengan status: **Baru**, **Cocok** (sudah ada transaksi manual), **Error**. |
| FR-06-05 | Pengguna mengatur kategori untuk baris Baru. |
| FR-06-06 | Pengguna bisa menyimpan aturan kategori berdasarkan kata kunci untuk import berikutnya. |
| FR-06-07 | Tombol simpan menyimpan baris Baru dan menautkan baris Cocok. |
| FR-06-08 | Riwayat import: tanggal, nama file, jumlah per status, dan tombol **Batalkan import**. |

## 5. Business Rules

- `amount` tetap positif dan integer sesuai PRD.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** file Bank A, **When** diimpor dan disimpan, **Then** transaksi masuk sesuai isi file.
- [ ] **Given** file Bank B, **When** diimpor dan disimpan, **Then** transaksi masuk sesuai isi file.
- [ ] **Given** transaksi yang sudah dicatat manual, **When** mutasi yang sama diimpor, **Then** baris tersebut berstatus Cocok.
- [ ] **Given** import dibatalkan, **When** dicek, **Then** hanya transaksi dari import itu yang hilang.

## 8. Verifikasi via MCP

- [ ] **Supabase:** jumlah & isi transaksi sebelum import, sesudah import, dan sesudah batalkan.
- [ ] **Chrome DevTools:** rekaman performa parsing file 50.000 baris.
- [ ] **Context7:** dokumentasi library parser.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Format XLSX/PDF, koneksi API bank langsung.

## 10. Catatan untuk Agent
- File: `app/import/`, `components/import/`, `app/api/v1/imports/`, `lib/import/`.
