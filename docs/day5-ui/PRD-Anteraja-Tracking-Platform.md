# PRD — Anteraja Tracking & Operations

## Masalah

Status seperti “in transit” belum menjawab apakah paket aman atau terlambat, kapan tiba, dan apa yang harus dilakukan bila gagal. Seller dan CS juga kehilangan waktu karena risiko, alamat, timeline, dan percakapan berada di tempat berbeda.

## Tujuan dan pengguna

Tracking proaktif membantu penerima bertindak sebelum kendala berubah menjadi komplain. Seller memprioritaskan risiko, CS menerima konteks lengkap, dan Finance menelusuri settlement kembali ke resi.

## Scope MVP

1. Tracking publik berbasis resi + kode akses.
2. Timeline, estimasi, lokasi terakhir, dan status Sesuai Jadwal/Berisiko/Perlu Tindakan.
3. Perjelas alamat, jadwal ulang, atau safe drop.
4. Tiket CS dengan snapshot konteks.
5. Notifikasi opt-in untuk perubahan bermakna.
6. Control tower seller dengan filter, pencarian, dan ekspor.
7. Hubungan shipment → settlement → mutasi bank.

## Keberhasilan

- Informasi utama terlihat dalam satu layar dan maksimal tiga interaksi dari halaman awal.
- Semua kendala mempunyai alasan dan next best action.
- Seller memisahkan prioritas tanpa spreadsheet.
- Tiket CS tidak meminta pengguna mengulang informasi.
- Tidak ada PII lengkap pada response publik atau data lintas user.

Rules dipakai sebelum machine learning: jeda scan >6 jam menandai risiko; alamat tidak lengkap/penerima tidak ada menandai perlu tindakan. Optimasi rute, ML ETA, chatbot bebas, dan penggantian core logistics berada di luar scope. Integrasi eksternal memakai adapter/outbox sampai API resmi tersedia.
