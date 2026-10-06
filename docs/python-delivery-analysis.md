# Analisis waktu pengiriman dengan Python

Notebook `exercises/python-delivery-analysis/shipment-delivery-analysis.ipynb` berisi analisis dataset asli tugas dan output yang sudah dieksekusi. Tugas berlabel Day 16; folder lokal pengumpulan bernama Day 17 sesuai penempatan modul.

## Dataset dan reproducibility

Sumber: [CSV pada Google Drive dari instruksi tugas](https://drive.google.com/file/d/1YS9AzFdYqvrhcDBcEezSLyisCpNTKvXC/view). Salinan byte-asli disertakan sebagai `shipments.csv`; SHA-256 dicetak notebook dan dicatat dalam `results/analysis-summary.json`. Dataset simulasi, bukan data pelanggan maupun bukti kinerja kurir sebenarnya.

Notebook memakai enam kolom wajib dan menghitung ulang `delay_hours`, walaupun sumber sudah memiliki kolom delay. Audit melaporkan jumlah baris yang dibuang, termasuk nol jika sumber sudah bersih. Contoh data rusak untuk test cleaning terpisah dari data analisis.

## Jalankan di Google Colab

1. Unduh notebook dan CSV dari folder exercise pada branch `feature/python-delivery-analysis`.
2. Buka Google Colab, pilih File > Upload notebook, lalu unggah `.ipynb`.
3. Pilih Runtime > Run all. Jika CSV belum tersedia, sel pertama meminta upload `shipments.csv`.
4. Tunggu semua sel selesai dan pastikan validasi terakhir menampilkan PASS.
5. Pilih File > Download > Download .ipynb untuk menyimpan hasil sesi Colab kamu.

Output yang disertakan dikerjakan melalui kernel Python lokal. Tidak ada klaim notebook telah dibuat atau dijalankan dalam akun Google Colab milik pengguna. Format notebook dan jalur upload disiapkan untuk Colab.

## Pemetaan instruksi ke notebook

| Instruksi | Bagian |
| --- | --- |
| Variabel, list, dictionary, kondisi, loop | 1. Fundamental Python |
| Shape, info, missing, duplikat | 2. Audit data |
| Numeric conversion, dropna, drop_duplicates, clip >= 0 | 3. Cleaning |
| NumPy min, median, mean, std | 4. Statistik |
| Loop manual vs groupby, kesetaraan hasil | 5. Grouping |
| Bar chart dan kurir dengan mean delay tertinggi | 6. Matplotlib |
| Korelasi jarak dan berat terhadap delay | 7. Pearson correlation |
| Train/test, Linear Regression, evaluasi | 8. Modeling |
| Rate jauh >50 dan dekat <10, insight | 9. Komparasi jarak |
| Limitasi dan tindakan operasional | 10. Kesimpulan |

## Definisi analisis

- `delay_hours = max(actual_hours - promised_hours, 0)`; paket datang lebih cepat tidak memiliki delay negatif.
- Statistik utama memakai NumPy. Standar deviasi sampel menggunakan `ddof=1`; standar deviasi populasi menggunakan `ddof=0` dan dilaporkan terpisah.
- Pearson r mengukur hubungan linear, bukan sebab-akibat. Tidak ada klaim jarak/berat merupakan satu-satunya penyebab delay.
- Fitur model: `distance_km` dan `weight_kg`. Waktu aktual dan waktu janji tidak digunakan sebagai fitur karena membentuk target secara langsung.
- Split 80/20, seed 42, tanpa indeks bertumpuk. MAE, RMSE, dan R-squared dibandingkan dengan baseline mean data train.
- Skor utama menggunakan prediksi regresi mentah; hasil clipping prediksi negatif menjadi nol dilaporkan sebagai varian terpisah.
- Rate terlambat memakai delay >0. Insight contoh rubrik memakai delay >2 jam, dengan jumlah kejadian dan denominator untuk kedua kelompok.
- Jarak tepat 10 atau 50 km masuk kelompok tengah, bukan dekat/jauh. Kelompok kosong dan rate dekat nol tidak menghasilkan rasio palsu.

## Berkas hasil

`results/` memuat grafik Matplotlib, dataset bersih, ringkasan kurir, prediksi data test, komparasi jarak, insight satu kalimat, dan JSON metrik/validasi. Semua dihasilkan saat notebook berjalan, bukan hasil yang ditulis manual untuk menyesuaikan kesimpulan.

## Git dan status pengumpulan

Branch: [feature/python-delivery-analysis](https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/python-delivery-analysis).

Perubahan disusun bertahap: cleaning/statistik, grouping/visualisasi/korelasi, kemudian model/evaluasi/insight. Setiap tahap menyimpan notebook yang sudah dieksekusi. Username partner tidak diberikan dan pengguna memilih tanpa partner untuk saat ini; review dan merge bukan syarat yang sudah terpenuhi. PR tidak boleh disebut approved/merged sebelum ada bukti persetujuan nyata.

## Batas penggunaan

Analisis ini memenuhi latihan pada dataset ratusan baris; bukan sistem prediksi produksi. Validasi temporal, variasi layanan, kondisi lalu lintas, cuaca, dan faktor kurir belum dimodelkan. Audit kapasitas/rute berdasarkan hasil hanya menjadi hipotesis untuk diuji pada data riil. Database dan aplikasi capstone tidak dimutasi oleh notebook ini.
