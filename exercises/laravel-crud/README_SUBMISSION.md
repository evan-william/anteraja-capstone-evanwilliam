# Courier & Shipment Records

Laravel 12 + PHP 8.2, Blade, Eloquent, SQLite lokal (relasional dengan foreign key).
SQLite dipilih agar demo tidak memerlukan instalasi server database. Supabase capstone tidak disentuh.

## Jalankan

```powershell
cd "D:\Work & Organization\Work\Maxy Academy\Modules\Daily Module\Day 14\anteraja-backend"
& C:\xampp\php\php.exe -d extension=zip "D:\Work & Organization\Work\Maxy Academy\Modules\Playground\tooling\composer.phar" install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
& C:\xampp\php\php.exe artisan key:generate
if (-not (Test-Path database/database.sqlite)) { New-Item database/database.sqlite -ItemType File }
& C:\xampp\php\php.exe artisan migrate --seed
& C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8014
```

Jika Composer sudah terpasang global: gunakan `composer install` menggantikan perintah composer.phar.
Buka http://127.0.0.1:8014/shipments. Instalasi lokal sekarang sudah berisi key dan database; cukup artisan serve.
Jangan menjalankan migrate:fresh pada database yang berisi data penting.

## Struktur MVC

- Migration `2026_10_01_000001_create_couriers_and_shipments.php`: couriers(name,rating),
  shipments(tracking_number unik,weight_kg,status,courier_id FK), timestamps; rollback urutan anak lalu induk.
- Courier::shipments = hasMany; Shipment::courier = belongsTo. FK mencegah penghapusan kurir yang digunakan.
- ShipmentController: eager loading courier, pagination, validasi, binding model, store/update/destroy.
- routes/web.php: Route::resource membuat ketujuh route CRUD, termasuk show/detail.
- Blade layout, shipments/index, form, show: @foreach/@if, escaping {{ }}, @csrf, @method.
- ShipmentSeeder: 3 kurir dan 12 kiriman, firstOrCreate memungkinkan seed diulang tanpa duplikasi.
- tests/Feature/ShipmentCrudTest.php: CRUD, validasi, resi duplikat, courier tidak ada, 404, seed, escaping.

## Cara demo

1. Buka daftar: kurir terkait dibaca dari relasi Eloquent, bukan HTML hardcoded.
2. Tambah resi unik, berat >0, status, kurir. Simpan menuju halaman detail.
3. Edit berat atau status, simpan. Reload: nilai tetap tersimpan pada database.
4. Hapus baris lalu konfirmasi; request DELETE memiliki token CSRF.
5. Coba resi duplikat, berat negatif, kurir invalid: ditolak validasi server.
6. Detail ID tidak ada: HTTP 404, bukan crash.

Jalankan test: `& C:\xampp\php\php.exe artisan test`.
Hasil: 7 test lulus, 36 assertions. Browser create/detail/edit/delete dan 375/768/1440 px lulus.
Latihan ini server lokal tanpa login: jangan mengekspos artisan serve ke jaringan publik.

Branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/laravel-crud
Review partner dan merge ditunda sesuai instruksi pemilik; bukti review tidak direkayasa.
