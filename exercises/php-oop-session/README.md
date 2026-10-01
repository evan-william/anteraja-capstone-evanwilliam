# Permintaan pengiriman - OOP, POST, dan Session

## Jalankan di PowerShell

```powershell
cd "D:\Work & Organization\Work\Maxy Academy\Modules\Daily Module\Day 13\php-oop-session"
& C:\xampp\php\php.exe -S 127.0.0.1:8013
```

Buka http://127.0.0.1:8013/shipment-form.html. PHP 8.2+ diperlukan; tidak perlu Composer atau database.
Jika server sudah berjalan, gunakan alamat yang sama, jangan jalankan server kedua pada port itu.

## Alur dan file

`shipment-form.html` --POST--> `submit-request.php` --objek--> `ShipmentRequest.php`
--array pada session--> `request-history.php` --konfirmasi--> `clear-history.php`.

- `ShipmentRequest.php`: properti resi/berat/jarak, constructor, calculateCost, toArray, validasi server.
- `common.php`: cookie HttpOnly/SameSite, penyimpanan sesi di luar web root, escaping, layout dan Rupiah.
- `submit-request.php`: cek metode/origin, validasi, simpan array, redirect 303 agar reload tidak mengirim ulang POST.
- `request-history.php`: foreach, total array_sum, empty state, pesan sukses sekali tampil.
- `clear-history.php`: link membuka konfirmasi; POST dengan token CSRF menghapus hanya riwayat sesi ini.
- `style.css`: layout responsif dan focus keyboard.
- `tests.php`: 18 pemeriksaan tarif/validasi.

Tarif latihan identik kalkulator Day 12: <=1 kg Rp10.000; >1-3 kg Rp17.000; >3-5 kg Rp25.000;
tambahan >5 kg Rp5.000/kg; tambahan >10 km Rp1.250/km. Kelebihan dibulatkan ke atas.
Contoh: 2,4 kg / 12,2 km = Rp20.750. Bukan tarif resmi Anteraja.
Berat/jarak wajib positif dan finite. Batas simulasi 1.000.000. Resi maksimal 80 karakter.
Nomor resi berulang boleh sebagai permintaan terpisah; tidak ditentukan unik oleh soal.

## Verifikasi

`& C:\xampp\php\php.exe tests.php`

18 checks lulus. Uji browser: POST valid, reload mempertahankan riwayat, sesi browser lain kosong,
input kosong/negatif/nonangka ditolak HTTP 422, clear history berhasil, tidak overflow pada 375/768/1440 px.
Session bukan database permanen dan dapat kedaluwarsa. Jangan gunakan latihan ini untuk transaksi produksi.

Branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/php-oop-session
Review partner dan merge ditunda sesuai instruksi pemilik proyek; jangan menandainya selesai sebelum disetujui.
