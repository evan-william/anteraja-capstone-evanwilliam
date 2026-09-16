# FRD-09 — Email Ringkasan Mingguan Terjadwal

| | |
|---|---|
| **MCP** | Resend · Supabase |
| **Tingkat** | ★★ |
| **Skill** | `fitur-email-mingguan` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Setiap Senin pukul 08.00 WIB, pengguna menerima email ringkasan pengeluaran minggu lalu dibandingkan minggu sebelumnya. Pengguna bisa mengubah frekuensi atau berhenti berlangganan.

## 2. User Story
> Sebagai pengguna yang jarang membuka aplikasi, saya ingin tetap sadar pola pengeluaran saya lewat email.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Resend | Mengirim email uji dan memeriksa status pengiriman. | Email uji di beberapa kondisi data |
| Supabase | Function agregasi, jadwal pengiriman, dan query verifikasi. | Jadwal aktif + query log pengiriman |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-09-01 | Pengaturan email: Mingguan (default), Bulanan, atau Mati. |
| FR-09-02 | Mingguan dikirim Senin 08.00 WIB untuk minggu lalu. |
| FR-09-03 | Bulanan dikirim tanggal 1 pukul 08.00 WIB untuk bulan lalu. |
| FR-09-04 | Isi: total pengeluaran, total pemasukan, perbandingan pengeluaran dengan periode sebelumnya dalam persen, 3 kategori terbesar, tombol ke aplikasi. |
| FR-09-05 | Email tampil baik di desktop dan HP. |
| FR-09-06 | Pengguna bisa berhenti berlangganan dari email. |
| FR-09-07 | Aplikasi menangani email yang bounce atau ditandai spam. |

## 5. Business Rules

- Angka di email identik dengan data di aplikasi.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** pengguna dengan pengaturan Mingguan, **When** jadwal Senin jalan, **Then** email minggu lalu terkirim.
- [ ] **Given** klik berhenti berlangganan, **When** jadwal berikutnya jalan, **Then** pengguna tidak menerima email.
- [ ] **Given** angka di email, **When** dibandingkan dengan query langsung, **Then** identik.

## 8. Verifikasi via MCP

- [ ] **Resend:** email uji dari beberapa pengguna uji dengan pola data berbeda.
- [ ] **Resend:** status pengiriman.
- [ ] **Supabase:** jadwal aktif dan log pengiriman.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Email marketing, A/B test subjek.

## 10. Catatan untuk Agent
- File: `emails/`, `app/pengaturan/email/`, `app/api/v1/email/`, `lib/integrations/resend/`, `supabase/functions/weekly-digest/`.
