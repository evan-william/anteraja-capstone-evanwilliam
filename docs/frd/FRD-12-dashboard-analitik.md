# FRD-12 — Dashboard Analitik

| | |
|---|---|
| **MCP** | 21st.dev Magic · Supabase · Chrome DevTools |
| **Tingkat** | ★★ |
| **Skill** | `fitur-dashboard` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Dashboard berisi kartu ringkasan, grafik komposisi pengeluaran per kategori, tren 12 bulan, dan heatmap pengeluaran harian.

## 2. User Story
> Sebagai pengguna, saya ingin memahami ke mana uang saya pergi dalam sekali lihat.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| 21st.dev | Mencari dan membangun komponen kartu statistik, chart, dan heatmap. | Komponen disesuaikan dengan konvensi repo |
| Supabase | Function agregasi dan query pembanding untuk setiap angka. | Function + query pembanding |
| Chrome DevTools | Screenshot beberapa kondisi data di beberapa ukuran layar, cek console. | Screenshot |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-12-01 | Filter periode: bulan ini, bulan lalu, 3 bulan, 12 bulan, custom. |
| FR-12-02 | Kartu: total pemasukan, total pengeluaran, selisih, rata-rata pengeluaran per hari. |
| FR-12-03 | Setiap kartu menampilkan perbandingan dengan periode sebelumnya yang setara. |
| FR-12-04 | Grafik komposisi pengeluaran per kategori. |
| FR-12-05 | Grafik tren pemasukan & pengeluaran 12 bulan. |
| FR-12-06 | Heatmap pengeluaran harian. |
| FR-12-07 | Klik kategori di grafik membuka halaman transaksi dengan filter yang sesuai. |

## 5. Business Rules

- Angka dashboard identik dengan data transaksi.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** setiap angka di kartu dan grafik, **When** dibandingkan dengan query pembanding, **Then** identik.
- [ ] **Given** filter periode diganti, **When** dashboard dimuat, **Then** semua bagian ikut berubah.

## 8. Verifikasi via MCP

- [ ] **21st.dev:** komponen yang dipakai dan penyesuaiannya.
- [ ] **Supabase:** tabel perbandingan angka dashboard vs query.
- [ ] **Chrome DevTools:** screenshot beberapa user uji dengan pola data berbeda di beberapa ukuran layar.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Prediksi, insight AI, ekspor grafik.

## 10. Catatan untuk Agent
- File: `app/dashboard/`, `components/dashboard/`, `app/api/v1/analytics/`.
