# Desain UI — Anteraja Tracking & Operations

## Arah visual

UI memakai Open Sans lokal, magenta Anteraja `#E9007F`, latar hangat `#F8F7F5`, dan permukaan putih. Tracking publik memakai hero gelap agar pencarian fokus; ruang seller terang untuk kepadatan data. Logo, favicon, foto operasional, dan ikon dipakai sesuai konteks.

Tracking adalah produk utama. `/lacak` menjawab “di mana paket saya?” dan “apa langkah berikutnya?”. Setelah login, `/pengiriman` menjadi home seller. Arus dana, rekonsiliasi, dan kategori tetap tersedia sebagai modul Finance.

| Layar | Tujuan | Aksi utama |
|---|---|---|
| Lacak kiriman | Memulai tracking aman | Lacak kiriman |
| Status kiriman | Memahami perjalanan/risiko | Kirim instruksi |
| Control tower | Memprioritaskan kiriman | Buka detail |
| Detail operasional | Melihat konteks internal | Tinjau tindak lanjut |
| Rekonsiliasi | Mencocokkan settlement | Simpan hasil |

Risiko tidak bergantung pada warna: selalu ada ikon, label, dan penjelasan. Data publik dimasking, action memakai kode akses, error memberi pemulihan, dan tabel tetap bisa digulir di mobile. Motion memakai opacity/transform singkat dan menghormati `prefers-reduced-motion`.

Open Sans dipilih agar konsisten dengan identitas web publik Anteraja yang diperiksa. Heading weight 700 dengan tracking rapat; body 14–16 px. Grid dasar 4/8 px, radius 12–24 px sesuai hierarki, dan shadow hanya untuk elevasi nyata.
