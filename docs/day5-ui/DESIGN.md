# Desain UI — Anteraja Finance

## Keputusan desain

Saya mempertahankan pola kerja FRD-06 dan mengubah konteks tampilannya menjadi keuangan operasional pengiriman. Tracking tidak dijadikan fitur tempelan. Nomor resi muncul sebagai penghubung antara pengiriman dan settlement, sementara keputusan menyimpan transaksi tetap mengikuti data mutasi bank.

Tampilan memakai dasar terang, teks gelap, dan merah sebagai warna aksi utama. Merah tidak dipakai untuk semua permukaan karena status error juga membutuhkan arti yang jelas. Hijau menandai kecocokan, amber menandai pekerjaan yang belum selesai, dan abu-abu dipakai untuk informasi sekunder.

Ikon paket pada prototipe adalah penanda produk internal, bukan pengganti logo resmi perusahaan.

## Peta layar

| Layar | Pertanyaan yang dijawab | Aksi utama |
|---|---|---|
| Ringkasan | Berapa dana masuk, biaya, dan mutasi yang perlu diperiksa? | Rekonsiliasi mutasi |
| Unggah | File apa yang dapat dipakai dan apakah data sudah disimpan? | Pilih file CSV |
| Preview | Baris mana yang Baru, Cocok, atau Error? | Simpan hasil rekonsiliasi |
| Riwayat | Proses apa yang pernah dilakukan dan dapatkah dibatalkan? | Batalkan impor |
| Rincian shipment | Bagaimana resi, COD, biaya, settlement, dan mutasi terhubung? | Lihat riwayat |

## Hierarki dan interaksi

- Satu aksi utama dipakai pada setiap layar (`rule/one-primary-action`).
- Navigasi berpindah halaman; tombol menjalankan tindakan (`rule/navigation-vs-action`).
- Kategori baris diedit langsung di tabel karena perubahan hanya memengaruhi satu baris (`rule/inline-before-modal`, `rule/smallest-intervention`).
- Tabel dipertahankan untuk pekerjaan rekonsiliasi karena pengguna perlu membandingkan banyak kolom sekaligus (`rule/preserve-mental-model`).
- Tombol pembatalan menyebut objek dan konsekuensinya, bukan memakai label umum (`rule/name-object-scope-consequence`, `rule/destructive-names-action`).
- Pembatalan memakai konfirmasi karena berdampak pada transaksi yang telah dibuat (`rule/destructive-proportional`).

## Keadaan yang dirancang

Desain mencakup keadaan awal, loading, preview campuran, validasi, error, berhasil, riwayat kosong/terisi, pembatalan, dan mobile (`rule/cover-reachable-states`). Error selalu memberi langkah pemulihan (`rule/error-states-recovery`), input preview tetap tersimpan saat permintaan gagal (`rule/preserve-user-input`), dan label proses tetap spesifik (`rule/loading-state-specific`).

Kontrol memiliki label yang dapat dibaca pembaca layar (`rule/accessible-name-required`), fokus keyboard terlihat (`rule/no-custom-focus-bypass`), dan alur unggah sampai simpan dapat diselesaikan dengan keyboard (`rule/keyboard-complete-flow`).

## Sistem visual

- **Tipografi:** Arial/Helvetica untuk ketersediaan lintas perangkat; angka memakai tabular numerals.
- **Lebar konten:** maksimum 1.180 px agar tabel memiliki ruang tanpa membuat teks terlalu panjang.
- **Radius:** 8–12 px, cukup ramah tanpa membuat semua elemen berbentuk pil.
- **Bayangan:** hanya 1 px yang tipis pada panel; struktur dibedakan terutama oleh garis dan jarak.
- **Warna utama:** merah `#D92D3F`; latar `#F7F4F3`; teks `#241D1D`.
- **Grid:** 8 px; jarak antarbagian 20–32 px.

## Hubungan dengan FRD-06

Desain tidak mengubah kontrak fitur yang sudah diuji. Status, kategori, aturan kata kunci, penyimpanan, riwayat, dan pembatalan tetap berasal dari FRD-06. Referensi pengiriman ditambahkan sebagai konteks yang dapat diisi ketika data settlement menyediakannya. API tracking langsung tetap dicatat sebagai tahap lanjutan, bukan dibuat seolah-olah sudah tersedia.

## File desain

Seluruh hasil akhir berada di `docs/day5-ui/designs/` dalam format WebP. Nama file memakai nomor urut dan fungsi layar supaya urutannya jelas saat diperiksa.
