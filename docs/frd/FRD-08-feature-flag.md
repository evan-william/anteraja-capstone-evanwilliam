# FRD-08 — Feature Flag & A/B Test Form Transaksi

| | |
|---|---|
| **MCP** | PostHog · Supabase · Chrome DevTools |
| **Tingkat** | ★★ |
| **Skill** | `fitur-eksperimen-form` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Menguji form Tambah Transaksi versi baru ke 50% pengguna lewat feature flag PostHog, dan mengukur apakah versi baru meningkatkan jumlah transaksi tercatat.

## 2. User Story
> Sebagai product owner, saya ingin menguji form baru ke sebagian pengguna dan melihat hasilnya dengan data yang bisa dipercaya.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| PostHog | Membuat feature flag `form-transaksi-v2` (control/v2, 50/50), experiment, dan membaca event. | Flag + experiment + event terverifikasi |
| Supabase | Query jumlah transaksi per varian sebagai pembanding. | Query pembanding |
| Chrome DevTools | Merekam pemuatan halaman dan request ke PostHog. | Rekaman pemuatan |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-08-01 | Form v2: keypad nominal besar dan chip 5 kategori terakhir dipakai. |
| FR-08-02 | 50% pengguna melihat control, 50% melihat v2. |
| FR-08-03 | Pengguna melihat varian yang sama setiap kali membuka form. |
| FR-08-04 | Akun internal tim selalu melihat v2 dan tidak dihitung di experiment. |
| FR-08-05 | Event exposure dan event `transaksi_disimpan` dikirim ke PostHog dengan informasi varian. |
| FR-08-06 | Form tetap bisa dipakai walau PostHog bermasalah. |
| FR-08-07 | Mematikan flag mengembalikan semua pengguna ke control. |

## 5. Business Rules

- Struktur transaksi yang disimpan dari control dan v2 identik.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** flag aktif, **When** beberapa user uji membuka form, **Then** pembagian varian sesuai flag.
- [ ] **Given** transaksi uji disimpan, **When** event PostHog dibandingkan dengan database, **Then** jumlahnya sama.
- [ ] **Given** flag dimatikan, **When** form dibuka ulang, **Then** semua pengguna melihat control.

## 8. Verifikasi via MCP

- [ ] **PostHog:** konfigurasi flag & experiment.
- [ ] **PostHog:** event per varian dari sesi uji.
- [ ] **Supabase:** jumlah transaksi uji per varian.
- [ ] **Chrome DevTools:** rekaman pemuatan halaman dengan jaringan lambat.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Analisis statistik manual, experiment di halaman lain.

## 10. Catatan untuk Agent
- File: `components/transaction-form-v2/`, `lib/integrations/posthog/`, `lib/flags.ts`, titik render form.
