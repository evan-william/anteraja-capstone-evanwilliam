# FRD-10 — Auth Lengkap: Password, Magic Link, Google

| | |
|---|---|
| **MCP** | Supabase · Chrome DevTools |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-auth` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Mengganti user demo dengan autentikasi Supabase: email + password, magic link, dan Google.

## 2. User Story
> Sebagai pengguna, saya ingin masuk dengan cara yang saya suka dan tetap login dengan aman.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Supabase | Membaca user & data uji, policy akses tabel, advisor keamanan, dan log auth. | Hasil advisor keamanan + uji akses antar user |
| Chrome DevTools | Memeriksa cookie, redirect, dan request selama alur login/logout. | Screenshot & rekaman alur |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-10-01 | Daftar dan masuk dengan email + password. |
| FR-10-02 | Verifikasi email sebelum bisa memakai aplikasi. |
| FR-10-03 | Masuk dengan magic link. |
| FR-10-04 | Masuk dengan Google. |
| FR-10-05 | Lupa password lewat email. |
| FR-10-06 | `getCurrentUser()` di `lib/auth.ts` memakai session Supabase dengan bentuk return yang sama seperti sebelumnya. |
| FR-10-07 | Halaman aplikasi hanya bisa diakses setelah login. |
| FR-10-08 | Setelah login, pengguna kembali ke halaman yang tadi ingin dibuka. |
| FR-10-09 | Pengguna tetap login saat membuka aplikasi lagi. |
| FR-10-10 | Keluar dari perangkat ini dan keluar dari semua perangkat. |
| FR-10-11 | Ganti password dari halaman keamanan akun. |
| FR-10-12 | Data milik user demo dipindahkan ke akun dengan email yang dikonfigurasi di env. |

## 5. Business Rules

- Pengguna hanya bisa mengakses datanya sendiri.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** pengguna belum login, **When** membuka `/transaksi`, **Then** diarahkan ke halaman masuk dan kembali ke `/transaksi` setelah login.
- [ ] **Given** user A login, **When** mengakses data milik user B, **Then** ditolak.
- [ ] Semua fitur lama tetap berjalan tanpa perubahan pemanggilan `getCurrentUser()`.

## 8. Verifikasi via MCP

- [ ] **Supabase:** advisor keamanan.
- [ ] **Supabase:** uji akses silang dua user.
- [ ] **Chrome DevTools:** cookie dan redirect chain saat login & logout.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
2FA, passkey, SSO perusahaan.

## 10. Catatan untuk Agent
- File: `app/(auth)/`, `middleware.ts`, `lib/auth.ts`, `lib/supabase/`, `app/pengaturan/keamanan/`.
