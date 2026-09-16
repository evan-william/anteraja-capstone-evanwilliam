# FRD-11 — Dompet Bersama dengan Undangan & Peran

| | |
|---|---|
| **MCP** | Supabase · Resend · Chrome DevTools |
| **Tingkat** | ★★★ |
| **Skill** | `fitur-dompet-bersama` |

> FRD ini menjelaskan apa yang harus dibangun. Kondisi khusus yang tidak ditulis di sini, kamu yang putuskan dan catat di `decisions.md`.

## 1. Ringkasan
Pengguna membuat dompet bersama, mengundang orang lain lewat email, dan mengatur peran. Transaksi dompet bersama terpisah dari transaksi pribadi.

## 2. User Story
> Sebagai pasangan atau keluarga, kami ingin mencatat pengeluaran bersama di satu tempat dengan hak akses yang jelas.

## Peran

| Aksi | Pemilik | Editor | Pembaca |
|---|---|---|---|
| Lihat transaksi dompet | ✅ | ✅ | ✅ |
| Tambah transaksi | ✅ | ✅ | ❌ |
| Edit/hapus transaksi milik sendiri | ✅ | ✅ | ❌ |
| Edit/hapus transaksi orang lain | ✅ | ❌ | ❌ |
| Kelola kategori dompet | ✅ | ✅ | ❌ |
| Undang & ubah peran | ✅ | ❌ | ❌ |
| Hapus dompet | ✅ | ❌ | ❌ |

## 3. Peran MCP

| MCP | Dipakai agent untuk | Output |
|---|---|---|
| Supabase | Skema, policy akses, dan uji aksi sebagai beberapa user berbeda. | Hasil uji tiap aksi per peran |
| Resend | Mengirim email undangan uji. | Email undangan |
| Chrome DevTools | Menjalankan sesi pemilik dan anggota untuk menguji alur undangan. | Rekaman kedua sesi |

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-11-01 | Pengguna membuat dompet bersama dan otomatis menjadi Pemilik. |
| FR-11-02 | Pemilik mengundang lewat email dengan peran tertentu. Undangan berlaku 7 hari. |
| FR-11-03 | Penerima undangan bergabung ke dompet setelah menerima undangan. |
| FR-11-04 | Pemilik bisa membatalkan undangan, mengubah peran, dan mengeluarkan anggota. |
| FR-11-05 | Anggota bisa keluar dari dompet. |
| FR-11-06 | Pemilik bisa mengalihkan kepemilikan ke anggota lain. |
| FR-11-07 | Transaksi dompet mencatat siapa yang membuatnya. |
| FR-11-08 | Log aktivitas dompet: tambah, ubah, hapus, undang, keluarkan. |

## 5. Business Rules

- Aturan peran berlaku di semua cara akses data, bukan hanya di tampilan.
- Transaksi pribadi tidak terlihat dari dompet bersama, dan sebaliknya.

## 6. Data Model
Dirancang sendiri mengikuti konvensi di PRD.

## 7. Acceptance Criteria

- [ ] **Given** tabel peran, **When** setiap aksi diuji untuk setiap peran, **Then** hasilnya sesuai tabel.
- [ ] **Given** undangan dikirim, **When** penerima menerima undangan, **Then** ia menjadi anggota dengan peran yang dipilih.

## 8. Verifikasi via MCP

- [ ] **Supabase:** hasil uji setiap aksi untuk setiap peran.
- [ ] **Resend:** email undangan uji.
- [ ] **Chrome DevTools:** rekaman undang → terima → ubah peran → keluarkan.
- [ ] Bukti tiap keputusan di `decisions.md`.

## 9. Out of Scope
Pembagian tagihan antar anggota, notifikasi real-time.

## 10. Catatan untuk Agent
- File: `app/dompet/`, `components/shared-wallet/`, `app/api/v1/wallets/`, `lib/integrations/resend/`.
