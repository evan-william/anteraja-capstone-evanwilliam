# Cara kerja kalkulator tarif

Kalkulator menghitung tarif pada server PHP. Formulir web dan contoh terminal menggunakan fungsi yang sama di `shipping-calculator.php`, sehingga hasilnya konsisten.

## Susunan berkas

| Berkas | Tugas |
| --- | --- |
| `shipping-calculator.php` | Data tier, aturan jarak, lima fungsi, lima contoh, dan keluaran terminal. |
| `index.php` | Formulir HTML, validasi masukan, tabel contoh, serta hasil dari fungsi PHP. |
| `style.css` dan `assets/` | Tampilan responsif, logo, dan font lokal. |
| `tests/shipping-calculator-test.php` | Sembilan pemeriksaan batas tier, jarak, format Rupiah, rekursi, dan input salah. |

## Variabel dan fungsi

`$tiers` adalah array global berisi tiga tier dan harga dasar. `calculateTierPrice(float $weight, float $distanceKm): float` memakai `if/elseif/else` untuk memilih tier berdasarkan batas berat. Fungsi ini lalu mencari harga dasarnya dengan `foreach`, bukan menulis harga terpisah untuk setiap kiriman.

Berat dan jarak yang diberikan ke fungsi adalah variabel lokal. Aturan tambahan juga disimpan sekali sebagai variabel global: jarak 10 km pertama termasuk dalam harga dasar; setiap km tambahan atau bagiannya dikenai Rp1.250. Jika berat melewati 5 kg, setiap kg tambahan atau bagiannya dikenai Rp5.000. Pembulatan ke atas dilakukan hanya pada bagian yang melewati batas.

`calculationCount()` memakai variabel `static $count`, sehingga jumlah pemanggilan tetap tersimpan selama satu request PHP. Saat skrip terminal dijalankan, lima kiriman dihitung untuk setiap baris dan lima kali lagi oleh fungsi total; hasilnya 10 pemanggilan.

`formatCurrency(float $amount): string` menghasilkan format Rupiah, misalnya `Rp20.750`. `describeShipment(array $shipment): string` memanggil `calculateTierPrice()` dan `formatCurrency()` untuk membentuk satu baris keluaran.

`sumShipmentCosts(array $shipments, int $index = 0): float` adalah fungsi rekursif. Jika indeks sudah mencapai jumlah kiriman, fungsi mengembalikan `0.0` sebagai *base case*. Jika belum, fungsi menjumlahkan tarif kiriman saat ini dengan hasil pemanggilan dirinya untuk indeks berikutnya.

Sebagai contoh, paket 6,2 kg dengan jarak 25,5 km memakai tier dasar Rp25.000, tambahan berat dua kg Rp10.000, dan tambahan jarak 16 km Rp20.000. Totalnya `Rp55.000`.

## Hubungan dengan latihan OOP berikutnya

Parameter `weight` dan `distanceKm` sudah bernama jelas dan memiliki tipe. Saat materi OOP dimulai, `$tiers` serta aturan tambahan dapat menjadi properti class, sedangkan `calculateTierPrice()` dapat dipindahkan menjadi method tanpa mengubah rumus. Penggunaan `global` di sini sengaja memperlihatkan materi variabel global; desain class nanti dapat menghilangkan ketergantungan itu.

Untuk mencoba contoh dan menjalankan pengujian, ikuti [panduan menjalankan](CARA_RUN.md).
