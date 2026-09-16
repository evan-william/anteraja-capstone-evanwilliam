# FRD-05 — Sinkronisasi Dua Arah Tagihan ↔ Google Calendar

| | |
|---|---|
| **MCP** | Google Calendar · Supabase |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-tagihan-kalender` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna mencatat tagihan bulanan. Tagihan muncul sebagai event di kalender "Tagihan" di Google Calendar. Perubahan di aplikasi masuk ke kalender, dan perubahan di kalender masuk ke aplikasi.

## 2. User Story
> Sebagai pengguna, saya ingin tagihan saya muncul di Google Calendar dan tetap sinkron di mana pun saya mengubahnya, supaya saya tidak telat bayar.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Google Calendar | Mempelajari perilaku API di kalender uji, membaca hasil sinkronisasi aplikasi. | Catatan perilaku API di Skill + event hasil sinkron |
| Supabase | Skema, function jadwal jatuh tempo, query pencocokan tagihan dengan event. | Query pembanding tagihan ↔ event |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-05-01 | Tagihan berisi: nama, nominal, kategori, tanggal jatuh tempo bulanan (1–31), tanggal mulai, dan jumlah kali bayar (opsional). |
| FR-05-02 | Menghubungkan Google membuat kalender baru bernama "Tagihan". |
| FR-05-03 | Setiap tagihan muncul sebagai event berulang dengan pengingat sebelum jatuh tempo. |
| FR-05-04 | Pengguna bisa menandai tagihan lunas untuk bulan tertentu. |
| FR-05-05 | Pengguna bisa mengubah nama, nominal, atau tanggal jatuh tempo tagihan. |
| FR-05-06 | Pengguna bisa memindah tanggal satu kejadian di Google Calendar, dan aplikasi mengikutinya. |
| FR-05-07 | Pengguna bisa menghapus satu kejadian atau seluruh seri di Google Calendar, dan aplikasi mengikutinya. |
| FR-05-08 | Sinkronisasi dari kalender ke aplikasi berjalan otomatis. |

## 5. Business Rules

- Hanya kalender "Tagihan" yang disentuh aplikasi.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** tagihan baru, **When** sinkronisasi jalan, **Then** event berulang muncul di kalender "Tagihan".
- [ ] **Given** satu kejadian dipindah di Google Calendar, **When** sinkronisasi jalan, **Then** aplikasi menampilkan tanggal baru untuk bulan itu.
- [ ] **Given** daftar tagihan di aplikasi, **When** dibandingkan dengan event di kalender untuk 12 bulan ke depan, **Then** sama.

## 8. Verifikasi via MCP

- [ ] **Google Calendar:** event kalender "Tagihan" untuk 12 bulan ke depan dari beberapa tagihan dengan tanggal jatuh tempo berbeda.
- [ ] **Google Calendar:** perubahan dari sisi kalender dan hasilnya di aplikasi.
- [ ] **Supabase:** query pencocokan tagihan dengan event.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Kalender selain Google, tagihan mingguan/tahunan.

## 10. Catatan untuk Agent
- File: `app/tagihan/`, `components/bills/`, `app/api/v1/bills/`, `app/api/v1/integrations/google-calendar/`, `lib/integrations/google-calendar/`.
