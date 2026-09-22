# Keputusan produk

1. Tracking dan Finance berada dalam satu produk. Tracking menjadi alur utama; Finance melanjutkan jejak resi ke settlement dan mutasi bank.
2. Kode akses enam digit menjaga tracking publik tetap sederhana tanpa membuka informasi pribadi hanya dari nomor resi.
3. Risiko awal memakai aturan deterministik sebelum model prediksi: jeda scan lebih dari enam jam berarti **Berisiko**; masalah alamat atau penerima berarti **Perlu tindakan**.
4. Resolution dibatasi satu kali per hari agar instruksi kurir tidak saling menimpa.
5. Tiket CS menyimpan snapshot supaya konteks audit tidak berubah setelah tiket dibuat.
6. Integrasi eksternal memakai transactional outbox. Aplikasi tidak mengklaim memakai API resmi yang belum tersedia.
7. Ekspor seller mengikuti filter yang terlihat di layar.
8. Open Sans disimpan lokal agar rendering stabil dan tidak bergantung pada CDN.
9. Migrasi tracking bersifat additive supaya fungsi Finance dan rekonsiliasi tidak mengalami regresi.
