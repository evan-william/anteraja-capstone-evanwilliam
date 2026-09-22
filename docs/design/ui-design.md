# Desain UI Anteraja Tracking & Operations

## Arah visual

Antarmuka memakai Open Sans lokal, magenta Anteraja `#E9007F`, neutral gelap yang hangat, dan latar `#F8F7F5`. Magenta menjadi penanda aksi utama dan active state, bukan warna pengisi seluruh halaman.

Tracking publik dan ruang kerja seller memakai bahasa visual yang sama. Tracking menekankan kepastian status dan tindakan. Seller serta Finance mempertahankan kepadatan data agar tabel dan angka tetap cepat dipindai.

## Struktur navigasi

| Grup | Tujuan |
|---|---|
| Utama | Pengiriman dan Lacak Paket |
| Finance | Arus Dana, Rekonsiliasi, dan Kategori |

## Prinsip antarmuka

- Satu aksi utama per layar.
- Status selalu memiliki label atau ikon, bukan warna saja.
- Data dari resi hingga mutasi bank dapat ditelusuri sebagai satu jejak.
- Tabel tetap menjadi tampilan utama untuk data operasional padat.
- Radius, shadow, dan motion dipakai sesuai hierarki, bukan sebagai dekorasi umum.
- Motion memakai opacity dan transform singkat serta menghormati `prefers-reduced-motion`.
- Focus keyboard terlihat pada seluruh kontrol.

## Autentikasi

Login dan register memakai layout dua kolom. Foto operasional berada di sisi visual, sedangkan form tetap berada pada surface terang. Carousel memakai tiga foto dengan grading konsisten, pergantian otomatis, kontrol manual, tombol pause, dan pause saat hover atau focus.

Teks carousel memakai editorial scrim berlapis. Lapisan bawah menjaga keterbacaan di area sibuk, sedangkan bayangan arah kiri mempertahankan detail foto tanpa membuat seluruh gambar gelap. Teks tidak memakai kartu, badge, atau border dekoratif.

## Layar utama

| Layar | Informasi utama | Aksi utama |
|---|---|---|
| Lacak kiriman | Resi dan kode akses | Lacak kiriman |
| Status kiriman | Posisi, ETA, risiko, timeline | Kirim instruksi |
| Control tower | Metrik risiko dan daftar kiriman | Buka detail |
| Arus dana | Transaksi dan settlement | Tambah transaksi |
| Rekonsiliasi | Preview Baru/Cocok/Error | Simpan rekonsiliasi |

## Aset dan bukti

- Rancangan layar: [`screens/`](screens/)
- Hasil QA visual: [`../quality/evidence/`](../quality/evidence/)
- Bukti pengumpulan Day 5: [`../submissions/day-5/`](../submissions/day-5/)
