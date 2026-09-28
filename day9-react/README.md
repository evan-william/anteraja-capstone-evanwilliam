# Day 9 — pelacakan paket dengan React dan Vite

Latihan ini mengubah contoh halaman tracking menjadi komponen React. Kode berada di repository **Final Project Full**, branch `8-react`, pada folder `day9-react/`. Aplikasi operasional utama tetap berada di root repository dan tetap memakai Next.js; latihan Vite ini **tidak** menggantikan login, Supabase, atau fitur produksi. Data delapan kiriman berasal dari `src/data/shipments.ts` dan hanya untuk demonstrasi props/state.

## Jalankan

Dari root repository, jalankan `npm ci` satu kali. Lalu:

```powershell
cd day9-react
npm run dev
```

Buka alamat Vite yang ditampilkan (umumnya `http://127.0.0.1:5173`). Untuk memeriksa kode, jalankan `npm run typecheck` dan `npm run build` dari folder yang sama. Perintah Vite memakai dependensi root agar tidak ada dua `node_modules` dan dua lockfile untuk latihan ini.

## Susunan komponen

```text
main.tsx
└── App.tsx (pemilik state pencarian dan filter)
    ├── TrackingHeader
    ├── ShipmentForm
    ├── ShipmentList
    │   └── ShipmentCard × jumlah hasil
    └── ShippingCalculator (state wilayah dan berat miliknya sendiri)
```

`App` membaca `demoShipments` lalu meneruskan array hasil filter ke `ShipmentList` lewat props `shipments`. `ShipmentList` membuat satu `ShipmentCard` per kiriman dengan `shipments.map(...)` dan `key={shipment.id}`. `ShipmentCard` menerima satu objek `shipment` dan hanya menampilkan datanya; tidak ada props yang diubah oleh komponen anak.

`ShipmentForm` menerima `draft`, `status`, dan callback dari `App`. Input resi adalah controlled component: `value={draft}` dan `onChange` memanggil `setDraft`. Klik **Cari kiriman** menyalin draft ke `query`; perubahan `query` atau `status` menghasilkan daftar baru. Klik **Reset** mengembalikan semua state ke awal. Bila hasil filter kosong, `ShipmentList` merender pesan “Tidak ada kiriman yang cocok” sebagai pengganti daftar. Status pada setiap kartu berasal dari kondisi `shipment.status` dan selalu mempunyai label teks.

`ShippingCalculator` memakai dua `useState` lokal untuk wilayah dan berat. Hasilnya berubah saat input berubah. Angka tarif adalah **contoh latihan, bukan tarif resmi Anteraja**.

## Coba saat presentasi

1. Buka halaman: delapan kiriman tampil dari satu dataset induk.
2. Cari `ANT-100015`, klik **Cari kiriman**: tersisa satu kiriman.
3. Cari `ANT-999999`: muncul empty state.
4. Klik **Reset**, lalu pilih status **Terkirim**: tampil dua kiriman.
5. Ubah berat ongkir menjadi `2.5`: simulasi menjadi `Rp 27.000` untuk Jabodetabek.

Semua aksi di atas memperbarui tampilan lewat state React; kode tidak memakai jQuery atau manipulasi DOM langsung. Bukti screenshot ada di `evidence/`.
