# Catatan Keputusan Produk

1. Tracking/resolution adalah produk utama; Finance menjadi modul pendukung, bukan dihapus.
2. Kode enam digit menjaga public tracking sederhana tanpa membuka PII hanya dari resi.
3. Rules deterministik dipakai sebelum ML: idle >6 jam = Berisiko; alamat/penerima bermasalah = Perlu Tindakan.
4. Resolution dibatasi sekali sehari agar instruksi kurir tidak saling menimpa.
5. Tiket menyimpan snapshot supaya konteks audit tidak berubah.
6. Integrasi eksternal memakai transactional outbox; API asli belum tersedia dan tidak dipalsukan.
7. Ekspor seller mengikuti filter yang sedang terlihat.
8. Open Sans di-host lokal supaya rendering stabil dan tidak bergantung CDN.
9. Migrasi tracking additive agar FRD-06 Finance tidak regresi.
