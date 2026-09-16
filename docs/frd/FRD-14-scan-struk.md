# FRD-14 — Scan Struk Jadi Transaksi (AI Vision)

| | |
|---|---|
| **MCP** | Supabase · Context7 · Chrome DevTools |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-scan-struk` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna memotret struk. AI (Gemini API) membaca merchant, tanggal, total, dan item, lalu aplikasi menampilkan form transaksi yang sudah terisi untuk dikonfirmasi.

## 2. User Story
> Sebagai pengguna, saya ingin mencatat belanja cukup dengan memotret struk.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Supabase | Storage untuk foto, tabel hasil scan, edge function pemanggil AI. | Konfigurasi Storage + data hasil scan |
| Context7 | Mengambil dokumentasi terbaru Gemini API dan library pemrosesan gambar. | Versi model/SDK tercatat di Skill |
| Chrome DevTools | Emulasi HP & jaringan lambat untuk alur foto/upload, cek request & console. | Rekaman alur di HP |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-14-01 | Pengguna mengambil foto dari kamera atau galeri, termasuk foto dari iPhone. |
| FR-14-02 | Foto disimpan di Supabase Storage. |
| FR-14-03 | AI membaca merchant, tanggal, total, subtotal, pajak, diskon, dan daftar item. |
| FR-14-04 | Form transaksi terisi otomatis dari hasil AI dan bisa diubah pengguna. |
| FR-14-05 | Kategori disarankan dari merchant dan item. |
| FR-14-06 | Transaksi tersimpan setelah pengguna menekan simpan. |
| FR-14-07 | Foto struk bisa dilihat lagi dari detail transaksi. |
| FR-14-08 | Pengguna bisa membatalkan scan. |
| FR-14-09 | Kuota 30 scan per pengguna per hari. |

## 5. Business Rules

- API key Gemini hanya di server.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** foto struk, **When** discan, **Then** form terisi dengan data dari struk.
- [ ] **Given** form terisi, **When** pengguna menyimpan, **Then** transaksi tersimpan dan foto bisa dibuka dari detail transaksi.

## 8. Verifikasi via MCP

- [ ] **Supabase:** konfigurasi Storage dan bukti siapa saja yang bisa membuka foto.
- [ ] **Context7:** dokumentasi Gemini API yang dipakai.
- [ ] **Chrome DevTools:** alur di HP dengan jaringan lambat.
- [ ] Hasil scan 5 struk berbeda (foto + hasil AI + form).
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Satu struk jadi beberapa transaksi, struk mata uang asing.

## 10. Catatan untuk Agent
- File: `app/scan/`, `components/receipt-scan/`, `supabase/functions/scan-receipt/`, `lib/image/`.
