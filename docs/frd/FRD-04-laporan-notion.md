# FRD-04 — Sinkronisasi Laporan ke Notion Database

| | |
|---|---|
| **MCP** | Notion · Supabase · Context7 |
| **Tingkat** | ★★ |
| **Skill** | `fitur-laporan-notion` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna menghubungkan Notion. Setiap bulan aplikasi mengirim laporan keuangan ke database Notion "Laporan Keuangan", lengkap dengan halaman detail per bulan.

## 2. User Story
> Sebagai pengguna Notion, saya ingin laporan keuangan bulanan saya selalu ada di Notion tanpa perlu salin manual.

## Skema Database Notion

| Properti | Tipe |
|---|---|
| Nama | Title (`Agustus 2026`) |
| Periode | Rich text (`2026-08`) |
| Pemasukan | Number |
| Pengeluaran | Number |
| Selisih | Number |
| Kategori Terboros | Rich text |
| Disinkron | Date |

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Notion | Membuat database uji, membaca hasil sinkronisasi. | Database "Laporan Keuangan" dengan skema di bawah |
| Supabase | Membuat function agregasi bulanan dan query pembanding. | Function + query pembanding |
| Context7 | Mengambil dokumentasi terbaru Notion API & SDK. | Versi API/SDK tercatat di Skill |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-04-01 | Pengguna menghubungkan Notion lewat OAuth dan memilih page tujuan. |
| FR-04-02 | Aplikasi membuat database "Laporan Keuangan" di page tujuan. |
| FR-04-03 | Satu baris per bulan. |
| FR-04-04 | Sinkronisasi otomatis setiap tanggal 1 pukul 07.00 WIB untuk bulan sebelumnya. |
| FR-04-05 | Pengguna bisa menjalankan sinkronisasi manual per bulan. |
| FR-04-06 | Perubahan transaksi di bulan yang sudah tersinkron ikut masuk ke Notion. |
| FR-04-07 | Halaman detail berisi ringkasan per kategori, 5 transaksi terbesar, dan perbandingan dengan bulan sebelumnya. |
| FR-04-08 | Halaman pengaturan menampilkan status sinkronisasi tiap bulan. |

## 5. Business Rules

- Angka di Notion identik dengan hasil function agregasi.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** Notion terhubung, **When** sinkronisasi Agustus dijalankan, **Then** baris Agustus dan halaman detailnya ada di Notion.
- [ ] **Given** transaksi Agustus diubah, **When** sinkronisasi berikutnya jalan, **Then** angka di Notion ikut berubah.
- [ ] **Given** angka di Notion, **When** dibandingkan dengan function agregasi, **Then** identik.

## 8. Verifikasi via MCP

- [ ] **Notion:** isi database dan halaman detail setelah beberapa kali sinkronisasi.
- [ ] **Supabase:** function agregasi vs query mentah.
- [ ] **Context7:** dokumentasi yang dipakai.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Sinkron dua arah, grafik di Notion.

## 10. Catatan untuk Agent
- File: `app/pengaturan/notion/`, `app/api/v1/integrations/notion/`, `lib/integrations/notion/`, `supabase/functions/notion-sync/`.
