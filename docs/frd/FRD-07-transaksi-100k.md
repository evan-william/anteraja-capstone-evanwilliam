# FRD-07 — Halaman Transaksi 100 Ribu Data

| | |
|---|---|
| **MCP** | Supabase · Chrome DevTools |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-tabel-transaksi` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Halaman tabel transaksi dengan pencarian, filter, sort, dan pagination yang tetap cepat untuk pengguna dengan 100.000 transaksi.

## 2. User Story
> Sebagai pengguna lama dengan data sangat banyak, saya ingin mencari dan menyaring transaksi dengan cepat di laptop maupun HP.

## Target Performa

| Metrik | Target (CPU 4x lebih lambat, jaringan Fast 4G) |
|---|---|
| LCP halaman `/transaksi` | < 2,5 detik |
| INP saat mengetik di pencarian & ganti filter | < 200 ms |
| Respons API daftar transaksi (p95) | < 300 ms |

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Supabase | Seed 100.000 transaksi untuk user uji, `EXPLAIN ANALYZE`, dan query pembanding. | Output EXPLAIN + query pembanding |
| Chrome DevTools | Performance trace dengan throttling CPU & jaringan, cek network request. | Trace sebelum & sesudah optimasi |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-07-01 | Kolom: tanggal, kategori, deskripsi, jumlah. |
| FR-07-02 | Pagination 50 baris per halaman. |
| FR-07-03 | Pencarian di `description`. |
| FR-07-04 | Filter: rentang tanggal, kategori, jenis (pemasukan/pengeluaran), rentang nominal. |
| FR-07-05 | Sort berdasarkan tanggal dan jumlah. |
| FR-07-06 | Link halaman bisa dibagikan dan menampilkan hasil yang sama. |
| FR-07-07 | Ringkasan di atas tabel: jumlah hasil, total pemasukan, dan total pengeluaran. |
| FR-07-08 | Tampilan tetap nyaman dipakai di HP. |

## 5. Business Rules

- Semua target performa tercapai.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** 100.000 transaksi, **When** trace diambil dengan throttling, **Then** semua target performa tercapai.
- [ ] **Given** filter aktif, **When** ringkasan dibandingkan dengan query langsung, **Then** identik.
- [ ] **Given** link dengan filter, **When** dibuka di tab baru, **Then** hasil sama.

## 8. Verifikasi via MCP

- [ ] **Supabase:** EXPLAIN ANALYZE query utama sebelum & sesudah optimasi.
- [ ] **Supabase:** query pembanding ringkasan untuk 3 kombinasi filter.
- [ ] **Chrome DevTools:** trace dengan LCP & INP.
- [ ] **Chrome DevTools:** screenshot tampilan HP.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Edit/hapus transaksi, ekspor.

## 10. Catatan untuk Agent
- File: `app/transaksi/`, `components/transactions-table/`, `app/api/v1/transactions/`, `scripts/seed-100k.ts`.
