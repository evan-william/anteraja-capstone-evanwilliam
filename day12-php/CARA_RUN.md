# Jalankan kalkulator tarif PHP

Panduan ini menjalankan kalkulator dari terminal dan membuka formulir web. Kamu hanya membutuhkan PHP 8.2 atau lebih baru; tidak perlu Node.js, database, atau API key.

## Mulai cepat di Windows

1. Buka terminal VS Code di folder `Final Project Full`.
2. Jalankan lima contoh kiriman:

   ```powershell
   & "C:\xampp\php\php.exe" ".\day12-php\shipping-calculator.php"
   ```

   Baris terakhir menampilkan `Total 5 kiriman: Rp130.750`.

3. Jalankan server PHP:

   ```powershell
   & "C:\xampp\php\php.exe" -S 127.0.0.1:8088 -t ".\day12-php"
   ```

4. Buka [http://127.0.0.1:8088/](http://127.0.0.1:8088/) di browser. Masukkan `2.4` untuk berat dan `12.2` untuk jarak, lalu pilih **Hitung tarif**. Hasilnya `Rp20.750`.

Tekan `Ctrl+C` di terminal server untuk menghentikannya. Jika port `8088` sudah dipakai, ganti angka itu pada perintah dan URL browser.

## Jalankan pengujian

Dari folder `Final Project Full`, jalankan:

```powershell
& "C:\xampp\php\php.exe" -l ".\day12-php\shipping-calculator.php"
& "C:\xampp\php\php.exe" -l ".\day12-php\index.php"
& "C:\xampp\php\php.exe" ".\day12-php\tests\shipping-calculator-test.php"
```

Kamu akan melihat dua pesan `No syntax errors detected` dan `Semua 9 pengujian lulus.`

## Jika PHP bukan dari XAMPP

Jika `php` sudah tersedia di `PATH`, ganti `& "C:\xampp\php\php.exe"` dengan `php`. Versi PHP dapat diperiksa dengan `php -v`.

Tarif dalam latihan ini adalah angka simulasi, bukan tarif resmi Anteraja. Lihat [penjelasan kode](PENJELASAN_KODE.md) untuk aturan tier, jarak, dan rekursi.
