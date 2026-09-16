# FRD-15 — Asisten Chat Keuangan

| | |
|---|---|
| **MCP** | Supabase · Context7 · Sentry |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-asisten-chat` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna bertanya dalam bahasa sehari-hari, misalnya "bulan lalu aku habis berapa buat makan?", dan asisten AI menjawab berdasarkan data transaksinya.

## 2. User Story
> Sebagai pengguna, saya ingin bertanya soal keuangan saya dengan bahasa biasa dan mendapat jawaban yang akurat.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Supabase | Function query untuk tool asisten dan query pembanding untuk tiap jawaban uji. | Function tool + tabel uji jawaban |
| Context7 | Mengambil dokumentasi terbaru SDK AI (tool calling, streaming). | Versi SDK & model tercatat di Skill |
| Sentry | Membaca error selama pengujian percakapan dan memperbaikinya. | Daftar error yang ditemukan & diperbaiki |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-15-01 | Halaman `/asisten` dengan chat streaming. |
| FR-15-02 | Model mengakses data lewat tool: `get_total`, `get_top_categories`, `search_transactions`, `compare_periods`, `list_categories`. |
| FR-15-03 | Asisten memahami ekspresi waktu: hari ini, kemarin, minggu ini, minggu lalu, bulan lalu, awal tahun, 3 bulan terakhir. |
| FR-15-04 | Asisten memahami nama kategori dengan bahasa sehari-hari. |
| FR-15-05 | Jawaban menampilkan sumber data yang dipakai. |
| FR-15-06 | Riwayat percakapan tersimpan per pengguna. |
| FR-15-07 | Batas 50 pesan per pengguna per hari. |
| FR-15-08 | Pertanyaan di luar keuangan pengguna tidak dijawab. |

## 5. Business Rules

- API key model hanya di server.
- Asisten hanya membaca data, tidak mengubah.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** 15 pertanyaan uji, **When** dijawab, **Then** setiap angka identik dengan query pembanding.
- [ ] **Given** pertanyaan tentang periode tanpa transaksi, **When** dijawab, **Then** jawabannya sesuai data.

## 8. Verifikasi via MCP

- [ ] **Supabase:** tabel 15 pertanyaan uji: pertanyaan, jawaban, tool yang dipanggil, hasil query pembanding.
- [ ] **Context7:** dokumentasi SDK AI yang dipakai.
- [ ] **Sentry:** error yang ditemukan saat pengujian.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Asisten yang bisa menambah/mengubah transaksi, suara.

## 10. Catatan untuk Agent
- File: `app/asisten/`, `components/assistant/`, `app/api/v1/assistant/`, `lib/assistant/`.
