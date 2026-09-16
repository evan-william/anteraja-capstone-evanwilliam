# FRD-13 — Pipeline Preview per Pull Request

| | |
|---|---|
| **MCP** | GitHub · Vercel · Supabase |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-pipeline-preview` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Setiap Pull Request menjalankan pengecekan kode, test, dan migrasi di database terpisah, lalu menghasilkan preview deployment.

## 2. User Story
> Sebagai pengembang, saya ingin setiap perubahan bisa dicoba di lingkungan terpisah sebelum digabung.

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| GitHub | Membuat workflow Actions, membuka PR uji, membaca hasil run & log, mengatur branch protection. | Workflow aktif + PR uji |
| Vercel | Membaca deployment, status build, dan log build preview. | Link preview dari PR uji |
| Supabase | Menyiapkan database preview dan menjalankan migrasi. | Migrasi di database preview |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-13-01 | Workflow PR menjalankan lint, typecheck, dan unit test. |
| FR-13-02 | Migrasi dijalankan di database preview, lalu test e2e Playwright dijalankan terhadap preview deployment. |
| FR-13-03 | Preview deployment memakai database preview. |
| FR-13-04 | Komentar otomatis di PR berisi link preview, status tiap tahap, dan daftar migrasi. |
| FR-13-05 | Screenshot & trace test e2e yang gagal tersedia di workflow. |
| FR-13-06 | Branch `main` wajib semua check hijau dan minimal 1 review. |
| FR-13-07 | Merge ke `main` menjalankan migrasi dan deployment production. |
| FR-13-08 | Workflow agent `.agents/workflows/perbaiki-ci.md`: baca run gagal → temukan penyebab → perbaiki → push. |

## 5. Business Rules

- Database production tidak pernah dipakai oleh preview.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** PR uji dengan migrasi baru, **When** workflow selesai, **Then** migrasi ada di database preview dan tidak ada di production.
- [ ] **Given** PR dengan test gagal, **When** workflow selesai, **Then** PR tidak bisa di-merge.
- [ ] **Given** workflow `perbaiki-ci` dijalankan, **When** selesai, **Then** run berikutnya hijau.

## 8. Verifikasi via MCP

- [ ] **GitHub:** run workflow PR uji dan pengaturan branch protection.
- [ ] **Vercel:** preview deployment dan log build.
- [ ] **Supabase:** migrasi di database preview vs production.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Rollback otomatis, canary release.

## 10. Catatan untuk Agent
- File: `.github/workflows/`, `playwright.config.ts`, `scripts/ci/`, `.agents/workflows/perbaiki-ci.md`.
- Supabase Branching butuh paket berbayar. Alternatifnya project Supabase kedua khusus preview.
