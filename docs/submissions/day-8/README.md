# Day 8 - Interaksi UX

Branch pengumpulan: [7-prototype](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/7-prototype).

Project Full sudah memiliki interaksi JavaScript yang diminta. Implementasinya memakai komponen React/TypeScript (TSX), bukan jQuery atau JavaScript yang ditulis langsung di tag `<script>`. Event seperti `onSubmit`, `onClick`, dan `onChange` mengubah state; React kemudian memperbarui DOM. Perubahan data yang penting tetap diverifikasi oleh API dan database, bukan hanya di browser.

## Interaksi yang bisa dibuktikan

| No. | Pengguna melakukan | Respons yang tampak | Event, kondisi, dan file | Commit implementasi |
|---|---|---|---|---|
| 1 | Mengisi email/password lalu menekan **Masuk** | Tombol berubah menjadi **Memeriksa akun…**, error muncul jika kredensial salah, akun valid diarahkan sesuai perannya | `useActionState`, `isPending`, validasi dan `roleHome()` di `app/masuk/sign-in-form.tsx` serta `app/masuk/actions.ts` | `7cbc94b` |
| 2 | Menekan indikator slide atau **Jeda carousel** di halaman masuk | Gambar dan teks berganti; slide otomatis berhenti saat hover/fokus atau reduced motion aktif | `onClick`, `onMouseEnter`, `onFocusCapture`, `useEffect`, `(index + 1) % slides.length` di `components/ui/auth-carousel.tsx` | `a3f28b6` |
| 3 | Menulis resi dan kode akses, lalu menekan **Lacak kiriman** | Format salah menampilkan pesan; format benar membuka detail resi | `onChange`, `onSubmit`, regex, `router.push()` di `components/tracking/tracking-search-form.tsx` | `7f80382` |
| 4 | Menekan **Tangani sekarang** pada kiriman yang perlu tindakan | Fokus dan posisi halaman berpindah ke formulir instruksi; pilihan alamat/jadwal/safe drop mengubah isi form | Kondisi `risk_status === 'action_required'`, anchor, `setType()`, `onSubmit` di `components/tracking/tracking-experience.tsx` | `827014d` |
| 5 | Membuka **Lihat peta perjalanan** | Peta dimuat hanya saat dibuka; rute jalan perkiraan atau fallback titik kota muncul | `onToggle`, `useState`, hasil fetch, fallback di `components/tracking/journey-map-disclosure.tsx` dan `journey-map.tsx` | `aa55548` |
| 6 | Seller mengirim tiket dari detail kiriman | Tombol menampilkan **Mengirim…**; nomor tiket atau error ditampilkan; Admin bisa melihat tiket | `onSubmit`, `pending`, `fetch()`, `router.refresh()` di `components/tracking/seller-ticket-form.tsx` | `8e1d89d` |
| 7 | Admin membuka asisten, bertanya, lalu memilih tindakan tiket | Balasan dan opsi tampil; perubahan status meminta konfirmasi sebelum dikirim | `onClick`, `onSubmit`, `useState`, kondisi `confirmAction` di `components/admin/operations-assistant.tsx` | `3d125cb` |

Tujuh interaksi di atas berasal dari tujuh commit berbeda yang sudah ada di branch yang sama. Filter risiko, pencarian kiriman, ekspor CSV/JSON, impor mutasi, dan notifikasi tracking juga aktif; tidak perlu membuat interaksi palsu untuk memenuhi jumlah minimal lima.

## Cara cek cepat

1. Jalankan project sesuai [README utama](../../../README.md).
2. Buka `/lacak`, coba resi `ANT-100015` dan kode `260926`; coba pula kode yang tidak valid untuk melihat pesan error.
3. Buka `/masuk`; amati loader, error form, dan nama akun pada header setelah berhasil masuk. Gunakan akun demo dari berkas privat lokal, jangan merekam password.
4. Sebagai Seller, buka **Pengiriman** lalu buat tiket dari salah satu detail kiriman. Sebagai Admin, buka **Tiket CS** dan asisten operasi.
5. Periksa bahwa submit ganda dicegah ketika tombol sedang pending dan aksi status tiket memerlukan konfirmasi.

## Yang dikumpulkan

- PDF LMS: `Daily Module/Day 8/Tugas 1 - Interaksi UX/day8-interaksi-ux.pdf`. Isinya link branch dan ringkasan interaksi.
- Video maksimal lima menit di Google Drive. Bagikan kepada `product.maxyacademy@gmail.com` dan `huda.maxy.academy@gmail.com` sebagai **Editor**.
- Setelah video diunggah, tambahkan tautannya ke pengumpulan LMS. Naskah dan urutan layar ada di [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md).

PDF tidak bisa membuktikan video sudah diunggah. Langkah rekam, upload, dan berbagi akses harus dilakukan dari akun Google milik peserta.
