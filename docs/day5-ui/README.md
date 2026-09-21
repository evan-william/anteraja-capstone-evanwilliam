# Day 5 - UI Design Anteraja Shipment Tracking

Dokumentasi ini menjelaskan rancangan antarmuka yang dibuat berdasarkan PRD dan FRD Anteraja Shipment Tracking Widget. Seluruh desain berada pada branch `5-ui` dan memakai format `.webp` agar ringan saat ditinjau di repository.

## Arah desain

Rancangan memakai pendekatan **operational clarity**: informasi pengiriman menjadi pusat perhatian, sedangkan identitas Anteraja muncul melalui aksen magenta yang digunakan secara terbatas untuk tindakan utama dan status penting. Kanvas berwarna hangat, garis pemisah tipis, tipografi padat, dan sedikit bayangan dipilih agar aplikasi terasa modern tanpa mengurangi keterbacaan.

## Wireframe awal

```text
HEADER: Logo | Lacak Paket | Portal Seller | Bantuan | Status Sistem

PENCARIAN                  RINGKASAN CONTOH
Judul                      Status + nomor resi
Penjelasan                 Rute asal ke tujuan
Input nomor resi           Status terakhir
Tombol lacak               Perkiraan tiba

DETAIL PENGIRIMAN          LANGKAH BERIKUTNYA
Ringkasan paket            Data tujuan
Timeline utama             Kontak penerima
Riwayat lokasi             Bantuan kontekstual

PERLU TINDAKAN             KONTEKS PAKET
Peringatan kendala         Status dan SLA
Form patokan               Ilustrasi lokasi
Konfirmasi nomor           Catatan privasi

PORTAL SELLER
Ringkasan KPI -> Filter -> Tabel pengiriman -> Aksi per baris
```

## Kumpulan desain

| File | Isi | Acuan FRD |
| --- | --- | --- |
| `01-pencarian-resi-desktop.webp` | Halaman awal pencarian resi | FR-01 AWB Lookup |
| `02-detail-pengiriman-desktop.webp` | Timeline dan indikator SLA | FR-01, FR-02 |
| `03-resolusi-alamat-desktop.webp` | Kondisi kendala dan form patokan | FR-03 |
| `04-dashboard-seller-desktop.webp` | Monitoring paket berdasarkan risiko | FR-05 |
| `05-detail-pengiriman-mobile.webp` | Adaptasi responsif halaman detail | NFR responsivitas |

## Pemetaan kebutuhan ke UI

- **AWB Lookup:** input menerima pola `ANT-000000` dan mengarahkan pengguna ke detail pengiriman.
- **Unified Timeline:** setiap peristiwa menampilkan waktu, bahasa konsumen, dan lokasi.
- **SLA Risk Indicator:** `Sesuai Jadwal`, `Berisiko`, dan `Perlu Tindakan` memakai warna serta teks, bukan warna saja.
- **Self-Service Resolution:** pengguna memilih kecamatan dan jalan, mengisi patokan maksimal 150 karakter, serta mengonfirmasi nomor penerima.
- **Context-Rich Escalation:** tombol bantuan menjelaskan bahwa nomor resi dan status terakhir akan dibawa otomatis.
- **Seller Monitoring:** KPI, filter status, pencarian resi, dan aksi per baris tersedia dalam satu alur pemantauan.
- **Privasi:** nama dan nomor telepon dimasking; petunjuk penggunaan data ditampilkan dekat form.

## State dan aksesibilitas

- Fokus keyboard terlihat pada input dan tombol.
- Label selalu terhubung dengan field yang sesuai.
- Status memakai teks eksplisit untuk membantu pengguna yang tidak dapat membedakan warna.
- Navigasi berubah menjadi menu pada layar kecil.
- Tabel seller dapat digeser horizontal pada layar sempit.
- Tombol utama dibatasi satu per layar agar prioritas aksi tetap jelas.

## Menjalankan prototype

Dari root repository:

```bash
cd src
python -m http.server 8080
```

Buka `http://localhost:8080`. Gunakan query berikut untuk membuka layar tertentu:

- `?screen=search`
- `?screen=tracking`
- `?screen=exception`
- `?screen=seller`

## Dokumentasi keputusan

1. Timeline dipilih sebagai konten utama karena pengguna pertama-tama ingin memahami posisi dan keadaan paket.
2. Form penyelesaian hanya muncul ketika status membutuhkan tindakan agar pengguna tidak dibebani pilihan yang tidak relevan.
3. Aksen merah-magenta dibatasi untuk brand dan tindakan; hijau, kuning, dan merah digunakan khusus untuk makna status.
4. Dashboard seller mengutamakan daftar yang dapat ditindaklanjuti daripada grafik dekoratif.
5. Seluruh data dalam desain adalah data contoh yang sudah dimasking dan tidak memuat kredensial atau data pribadi asli.
