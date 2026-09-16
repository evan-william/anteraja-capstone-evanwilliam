# FRD-01 — Langganan Premium & Billing

| | |
|---|---|
| **MCP** | Stripe (mode test) · Supabase · Resend |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-langganan-premium` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna bisa berlangganan Premium bulanan atau tahunan lewat Stripe, dengan trial, pembatalan, pindah paket, dan email notifikasi setiap perubahan status langganan.

## 2. User Story
> Sebagai pengguna, saya ingin berlangganan Premium dengan mudah dan yakin status langganan saya selalu benar, supaya saya hanya membayar untuk yang saya pakai.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Stripe | Membuat product, price bulanan Rp49.000 dan tahunan Rp490.000. Membaca customer, subscription, invoice, dan event hasil uji. | Product & price di Stripe test mode, status subscription uji |
| Supabase | Membuat skema, policy akses, dan query pencocokan status langganan dengan Stripe. | Migrasi + hasil query pencocokan |
| Resend | Mengirim email uji untuk setiap perubahan status. | Email uji tiap status |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01-01 | Halaman `/premium` menampilkan paket Gratis, Premium Bulanan, dan Premium Tahunan dengan harga yang diambil dari Stripe. |
| FR-01-02 | Pengguna berlangganan lewat Stripe Checkout. |
| FR-01-03 | Pengguna baru mendapat trial 7 hari. |
| FR-01-04 | Pengguna bisa membatalkan langganan. |
| FR-01-05 | Pengguna bisa pindah dari bulanan ke tahunan dan sebaliknya. |
| FR-01-06 | Aplikasi menangani pembayaran perpanjangan yang gagal. |
| FR-01-07 | Email dikirim saat: trial dimulai, pembayaran berhasil, pembayaran gagal, langganan dibatalkan, Premium berakhir. |
| FR-01-08 | Halaman `/pengaturan/langganan` menampilkan status langganan dan akses ke Stripe Customer Portal. |
| FR-01-09 | Fungsi `isPremium(userId)` di `lib/billing.ts` menjadi satu-satunya cara fitur lain mengecek status Premium. |

## 5. Business Rules

- Semua key Stripe yang dipakai adalah key mode test.
- Status langganan di aplikasi harus selalu sama dengan status di Stripe.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** pengguna baru, **When** berlangganan bulanan, **Then** trial 7 hari dimulai dan email trial terkirim.
- [ ] **Given** pengguna Premium, **When** membatalkan langganan, **Then** status di aplikasi dan Stripe sesuai keputusan di `decisions.md`.
- [ ] **Given** pembayaran perpanjangan gagal, **When** dicek di aplikasi, **Then** perilakunya sesuai keputusan di `decisions.md`.
- [ ] **Given** status subscription di Stripe, **When** dibandingkan dengan database, **Then** sama.

## 8. Verifikasi via MCP

- [ ] **Stripe:** product, price, dan subscription uji.
- [ ] **Stripe:** simulasi dengan beberapa kartu uji Stripe yang berbeda perilakunya.
- [ ] **Supabase:** query pencocokan status langganan dengan Stripe.
- [ ] **Resend:** email untuk setiap status.

## 9. Out of Scope
Pajak, invoice PDF custom, multi-mata uang, kupon di UI.

## 10. Catatan untuk Agent
- File: `app/premium/`, `app/pengaturan/langganan/`, `app/api/v1/billing/`, `lib/billing.ts`, `lib/integrations/stripe/`, `lib/integrations/resend/`, `components/billing/`.
