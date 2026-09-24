# Asisten operasi Admin

Tombol **Asisten operasi** tersedia di sudut kanan bawah seluruh halaman Admin: Pusat operasi (`/admin`), Semua kiriman (`/admin/kiriman`), detail kiriman, dan Tiket CS (`/admin/tiket`). Percakapan tetap terbuka saat kamu berpindah halaman melalui navigasi aplikasi. Hanya akun Admin yang dapat melihat tombol dan memakai endpoint-nya; halaman Seller, Konsumen, dan pelacakan publik tidak menampilkannya.

## Yang dapat dilakukan

- Menjawab pertanyaan tentang jumlah kiriman aktif, kiriman berisiko/perlu tindakan, dan tiket baru berdasarkan query database saat itu.
- Mencari kiriman berdasarkan resi atau kota, menampilkan tiket terbaru, serta membuka detail terkait.
- Menawarkan perubahan status tiket `Baru → Sedang ditangani → Selesai`. Admin harus menekan konfirmasi; perubahan dijalankan oleh RPC `admin_update_ticket_status` yang mencatat aktor dan waktu.
- Menjawab dengan mode data langsung bila kunci Gemini belum ada, kuota habis, kunci ditolak, atau layanan lambat. Mode ini tetap membaca database, bukan memakai data contoh buatan.

Asisten **tidak** menghapus data, mengubah kiriman, mengirim pesan kurir, atau membaca CSV/Finance Seller. Jawaban model bukan bukti suatu tindakan telah dijalankan; keberhasilan perubahan status ditampilkan hanya setelah API mengonfirmasinya.

## Menyalakan Gemini

1. Buat API key di [Google AI Studio](https://aistudio.google.com/apikey).
2. Tambahkan ke `.env.local` di root proyek (jangan ke file yang di-commit):

   ```env
   GEMINI_API_KEY=kunci_dari_ai_studio
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

3. Restart `npm run dev`, lalu masuk sebagai Admin dan buka `/admin`.
4. Tanyakan “Tampilkan tiket baru” atau “Cari resi ANT-100015”. Indikator jawaban membedakan **Gemini** dan **Data langsung**.

Model bawaan memakai Gemini 3.5 Flash-Lite. Jika model itu tidak tersedia untuk project AI Studio kamu, ganti `GEMINI_MODEL` dengan model yang tersedia pada akun tersebut. Ketersediaan free tier dan batas kuota dapat berubah; periksa halaman penggunaan/rate limit di AI Studio. Jangan menaruh kunci di variabel `NEXT_PUBLIC_...`, browser, atau Git.

Untuk free tier, kebijakan penyedia dapat mengizinkan data permintaan digunakan untuk meningkatkan produknya. Gunakan hanya data demo/sintetis sampai ada persetujuan pemrosesan data operasional nyata.

## Cara kerjanya

Browser → route Admin terautentikasi → alat baca data Supabase (RLS tetap berlaku) → Gemini opsional → jawaban dan pilihan yang dibuat server. Gemini menerima data ringkas yang relevan, bukan seluruh database; nama, nomor penerima, dan catatan bebas pelanggan tidak dikirim. Permintaan dibatasi ukuran, waktu, jumlah putaran alat, dan laju per akun.

Ini adalah **tool calling di dalam aplikasi**, bukan MCP server terpisah. Untuk penggunaan produksi dengan banyak instance, ganti pembatas laju berbasis memori dengan penyimpanan bersama dan lakukan tinjauan privasi sebelum mengirim data operasional nyata ke penyedia model eksternal.
