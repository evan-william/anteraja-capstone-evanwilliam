# Foto kota pada ringkasan tracking

Kartu ringkasan menggunakan foto kota **posisi terakhir** paket. Jika posisi terakhir tidak diketahui, foto kota tujuan boleh ditampilkan. Jika nama hub/kota tidak cocok dengan aset lokal, kartu tetap tampil dengan latar arang netral; aplikasi tidak menebak lokasi dari kota tujuan. Pemilihan kota berada di `lib/tracking/city-imagery.ts` dan tidak mengubah data tracking.

Semua gambar disimpan lokal sebagai WebP agar halaman tidak bergantung pada koneksi ke situs foto. Gambar di bawah dioptimalkan dari foto asli (diubah ukuran dan format; tampilan halaman dapat memotong komposisinya sesuai ukuran layar). Versi WebP dari foto CC BY-SA tetap dibagikan dengan lisensi CC BY-SA yang sama. Tautan kredit juga tampil pada kartu saat foto digunakan.

| Kota | Fotografer | Lisensi | Sumber asli |
| --- | --- | --- | --- |
| Jakarta | Georgi Kovachev | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [JakartaSkyline.jpg](https://commons.wikimedia.org/wiki/File:JakartaSkyline.jpg) |
| Bekasi | Everyone Sinks Starco | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [Bekasi aerial view.jpg](https://commons.wikimedia.org/wiki/File:Bekasi_aerial_view.jpg) |
| Tangerang Selatan | Penggunaandro | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [CBD Alam Sutera.jpg](https://commons.wikimedia.org/wiki/File:CBD_Alam_Sutera.jpg) |
| Tangerang | Vruztazzy | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Jembatan UNIS di Cikokol.jpg](https://commons.wikimedia.org/wiki/File:Jembatan_UNIS_(Jembatan_Merah)_di_Cikokol,_Tangerang.jpg) |
| Malang | Uliyanti | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Malang city.jpg](https://commons.wikimedia.org/wiki/File:Malang_city.jpg) |
| Semarang | Muhammad Cordiaz | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Simpang Lima Semarang.jpg](https://commons.wikimedia.org/wiki/File:Simpang_Lima_Semarang_-_panoramio_(cropped).jpg) |
| Surabaya | Rifky2011 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [Surabaya City Skyline in July 2025.jpg](https://commons.wikimedia.org/wiki/File:Surabaya_City_Skyline_in_July_2025.jpg) |
| Bandung | Sabung.hamster | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Bandung city centre.jpg](https://commons.wikimedia.org/wiki/File:Bandung_city_centre,_July_2014.jpg) |

Untuk memperbarui aset, jalankan `node tools/build-city-photos.mjs` dari root repository, lalu periksa hasilnya secara visual sebelum commit. Foto kota adalah ilustrasi lokasi, bukan foto paket atau bukti pemindaian aktual.
