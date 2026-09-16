# FRD-03 — Error Monitoring & Auto-Triage ke GitHub

| | |
|---|---|
| **MCP** | Sentry · GitHub · Supabase |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-error-monitoring` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Aplikasi mengirim error ke Sentry. Setelah itu agent menjalankan alur triage: ambil error dari Sentry, cari penyebab, perbaiki, dan buka Pull Request yang menautkan issue Sentry.

## 2. User Story
> Sebagai pengembang, saya ingin tahu error yang dialami pengguna dan memperbaikinya dengan cepat, tanpa data pengguna ikut terkirim ke layanan luar.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Sentry | Membaca issue, stack trace, breadcrumb, dan release. | Laporan triage 3 issue teratas |
| GitHub | Membuat branch, commit, membuka PR, dan menambah label. | PR perbaikan yang menautkan issue Sentry |
| Supabase | Membaca log di waktu yang sama dengan error. | Log pendukung di deskripsi PR |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-03-01 | Error dari client, server, route handler, dan edge function tercatat di Sentry. |
| FR-03-02 | Setiap event punya informasi release dan environment. |
| FR-03-03 | Stack trace di Sentry terbaca sebagai kode asli, bukan kode hasil build. |
| FR-03-04 | Error boundary menampilkan halaman ramah dengan kode referensi dan tombol "Coba lagi". |
| FR-03-05 | Pengguna bisa menambahkan cerita singkat ke error lewat form feedback. |
| FR-03-06 | Halaman `/dev/uji-error` (khusus development) memicu 4 jenis error: client, server, API, dan query database. |
| FR-03-07 | Workflow agent `.agents/workflows/triage-error.md`: ambil issue → reproduksi → perbaiki → test → buka PR. |
| FR-03-08 | Deskripsi PR memuat link issue Sentry, penyebab, perbaikan, cara reproduksi, dan bukti test. |

## 5. Business Rules

- Data pribadi dan data keuangan pengguna tidak boleh terkirim ke Sentry.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** 4 error dari `/dev/uji-error`, **When** dibuka di Sentry, **Then** keempatnya tercatat dengan stack trace yang terbaca.
- [ ] **Given** workflow triage dijalankan, **When** selesai, **Then** ada PR dengan link issue Sentry dan test yang lolos.

## 8. Verifikasi via MCP

- [ ] **Sentry:** event dari keempat jenis error.
- [ ] **Sentry:** bukti data yang terkirim sesuai keputusan di `decisions.md`.
- [ ] **GitHub:** PR hasil workflow triage.
- [ ] **Supabase:** log yang dikutip di PR.

## 9. Out of Scope
Alerting ke Slack, dashboard performa.

## 10. Catatan untuk Agent
- File: konfigurasi Sentry, `app/error.tsx`, `app/global-error.tsx`, `app/dev/uji-error/`, `lib/integrations/sentry/`, `.agents/workflows/triage-error.md`.
