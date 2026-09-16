# FRD-02 — Onboarding Wizard dari Desain Figma

| | |
|---|---|
| **MCP** | Figma · 21st.dev Magic · Chrome DevTools |
| **Tingkat** | ★★ |
| **Skill** | `fitur-onboarding` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna baru melewati wizard 4 langkah: profil keuangan, pilih kategori awal, target pengeluaran bulanan, dan transaksi pertama. Tampilan mengikuti desain Figma.

## 2. User Story
> Sebagai pengguna baru, saya ingin disiapkan dengan cepat sampai aplikasi siap dipakai.

## Desain
Gunakan file Figma dari fasilitator. Kalau tidak ada, pakai UI kit finance app dari Figma Community, lalu buat 4 frame langkah wizard dan 1 frame selesai.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Figma | Membaca frame, variabel/token desain, dan screenshot frame sebagai acuan. | Token desain di kode diambil dari Figma |
| 21st.dev | Mengambil komponen yang tidak ada di Figma, misal stepper dan date picker. | Komponen disesuaikan dengan token Figma |
| Chrome DevTools | Screenshot tiap langkah di beberapa ukuran layar dan cek console. | Screenshot perbandingan dengan Figma |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-02-01 | Wizard muncul untuk pengguna yang belum menyelesaikan onboarding. |
| FR-02-02 | Langkah 1 — Profil: sumber penghasilan (gaji tetap/freelance/usaha/lainnya) dan tanggal gajian (1–31). |
| FR-02-03 | Langkah 2 — Kategori: pilih dari 12 kategori rekomendasi dan bisa menambah kategori custom. |
| FR-02-04 | Langkah 3 — Target: nominal target pengeluaran bulanan, dengan saran angka berdasarkan penghasilan. |
| FR-02-05 | Langkah 4 — Transaksi pertama, boleh dilewati. |
| FR-02-06 | Pengguna bisa melanjutkan wizard yang belum selesai. |
| FR-02-07 | Tombol "Lewati semua" menyelesaikan onboarding dengan kategori default. |
| FR-02-08 | Kategori hasil onboarding tersimpan di tabel `categories`. |

## 5. Business Rules

- Warna, radius, spasi, dan font diambil dari token Figma.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** pengguna baru, **When** menyelesaikan 4 langkah, **Then** kategori dan target tersimpan dan wizard tidak muncul lagi.
- [ ] **Given** tampilan wizard, **When** dibandingkan dengan frame Figma, **Then** memakai token yang sama.
- [ ] **Given** pengguna keluar di tengah wizard, **When** kembali, **Then** bisa melanjutkan.

## 8. Verifikasi via MCP

- [ ] **Figma:** daftar token yang diambil dan file tempat token dipakai.
- [ ] **Chrome DevTools:** screenshot tiap langkah disandingkan dengan frame Figma.
- [ ] **21st.dev:** komponen yang diambil dan penyesuaiannya.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Animasi kompleks, tur fitur.

## 10. Catatan untuk Agent
- File: `app/onboarding/`, `components/onboarding/`, `app/api/v1/onboarding/`, `lib/design-tokens.ts`.
