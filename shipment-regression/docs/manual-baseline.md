# Baseline Shipment Request

Expected dicatat sebelum runner dibuat: `ANT-001`, berat `5`, jarak `25`, hasil `SUCCESS`; resi muncul di Request History. Tarif latihan adalah Rp25.000 + (25 - 10) x Rp1.250 = **Rp43.750**.

Pada 12 Oktober 2026, baseline dijalankan secara interaktif melalui browser tools, bukan runner Puppeteer dan bukan klaim bahwa Evan mengkliknya sendiri. Halaman `http://127.0.0.1:3121/shipment-form.html` dibuka pada context baru, tiga field diisi, lalu tombol submit diklik.

Observasi setelah submit:

- URL berpindah ke `request-history.php`.
- Pesan: `Permintaan ANT-001 berhasil disimpan.`
- Ringkasan: `1 permintaan`, total `Rp43.750`.
- Baris riwayat: `ANT-001`, `5 kg`, `25 km`, `Rp43.750`.

Baseline sesuai expected. Tidak ada data Supabase atau paket produksi yang diubah; aplikasi latihan menyimpan riwayat dalam PHP session. Screenshot otomatis tersedia setelah runner dijalankan, terpisah dari observasi interaktif ini.
