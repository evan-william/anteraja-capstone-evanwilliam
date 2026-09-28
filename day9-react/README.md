# Latihan React + Vite — Day 9 dan Day 10

Folder `day9-react/` adalah latihan komponen React pada branch `8-react`. Aplikasi utama di root repository tetap memakai Next.js dan Supabase. Latihan ini tidak mengganti autentikasi atau database aplikasi utama. Daftar delapan kiriman pada `src/data/shipments.ts` adalah data contoh; pilihan wilayah dan kode pos Day 10 berasal dari dua API publik yang terpisah.

## Jalankan dan uji

Dari root repository, jalankan `npm ci` satu kali. Lalu:

```powershell
cd day9-react
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://127.0.0.1:5173`. Pemeriksaan kode dan build dijalankan dari folder yang sama:

```powershell
npm run typecheck
npm run build
```

Untuk uji browser otomatis, jalankan `node ../node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173` pada terminal pertama, lalu `npm run test:day10` pada terminal kedua. Uji ini memerlukan internet karena memakai kedua API publik sungguhan. Tangkapan layar akan tersimpan di `evidence/`.

## Pohon komponen dan aliran data

```text
main.tsx
└── ShipmentProvider (Context: wilayah asal, tujuan, kode pos)
    └── App (state pencarian resi dan filter status; dataset contoh)
        ├── TrackingHeader
        ├── ShipmentForm (props dari App + Context)
        │   └── LocationFields (Context + useLocationData + usePostalSearch)
        ├── ShipmentList (props daftar hasil)
        │   └── ShipmentCard × jumlah hasil (props satu kiriman)
        └── ShippingCalculator (Context + state berat lokal)
```

`App` memiliki `draft`, `query`, dan `status` melalui `useState`. `ShipmentForm` menerima nilai dan callback melalui props. Input resi adalah controlled component: `value={draft}` dan `onChange` mengubah state induk. `App` meneruskan hasil filter ke `ShipmentList`; komponen ini merender `ShipmentCard` dengan `.map()` dan `key={shipment.id}`. Bila daftar kosong, ia menampilkan empty state. Props tidak dimutasi.

Day 10 menambah `ShipmentProvider` melalui `createContext` dan `useContext`. `LocationFields` (di dalam form) menyimpan provinsi/kota asal, provinsi/kota tujuan, dan kode pos terpilih lewat `useShipmentContext`. `ShippingCalculator` membaca pilihan rute yang sama tanpa props berantai. Berat tetap state lokal kalkulator. Mengganti provinsi membersihkan kota terkait; mengganti kota tujuan juga membersihkan kode pos lama. `ShipmentContext.displayName = 'ShipmentContext'` memudahkan identifikasi Provider di React DevTools.

## API publik dan custom hooks

| Sumber | Kegunaan | Berkas |
| --- | --- | --- |
| [API Wilayah Indonesia v2](https://github.com/emsifa/api-wilayah-indonesia) | Daftar provinsi dan kota/kabupaten untuk asal dan tujuan | `src/services/locationApi.ts`, `src/hooks/useLocationData.ts` |
| [API Kodepos](https://github.com/sooluh/kodepos) | Cari kode pos dengan nama kecamatan/kelurahan | `src/services/locationApi.ts`, `src/hooks/usePostalSearch.ts` |

`locationApi.ts` mengubah respons HTTP menjadi data bertipe dan menolak respons yang tidak sesuai format. `useLocationData(kind, provinceId?)` memuat provinsi atau kota. `usePostalSearch(keyword)` menunggu 400 ms setelah pengguna berhenti mengetik dan hanya mencari bila panjang kueri minimal tiga karakter. Kedua hook memakai `useEffect` dengan dependency yang spesifik, `AbortController`, dan cleanup untuk membatalkan request lama saat pilihan berubah atau komponen dilepas. Masing-masing mengembalikan `data`, `isLoading`, `isError`, `error`, dan `retry`. Pesan loading/error serta tombol **Coba lagi** terlihat pada UI.

Hasil kode pos disaring agar cocok dengan kota tujuan yang dipilih. Karena penyedia API memakai variasi penulisan nama (misalnya DKI Jakarta dan Daerah Khusus Ibukota Jakarta), komponen menormalisasi nama sebelum membandingkan. API Kodepos publik ini digunakan untuk latihan; jangan menganggap ketersediaan atau akurasinya sebagai jaminan produksi.

Kalkulator membaca rute bersama dan memperbarui angka contoh saat berat atau wilayah berubah. **Tarif tersebut simulasi pembelajaran, bukan tarif resmi Anteraja dan tidak melakukan booking pengiriman.**

## Coba saat presentasi

1. Cari resi `ANT-100015`, lalu coba `ANT-999999` untuk melihat empty state; gunakan **Reset**.
2. Pilih provinsi asal **Daerah Khusus Ibukota Jakarta**, kota **Jakarta Pusat**; pilih tujuan provinsi yang sama, kota **Jakarta Selatan**.
3. Ketik **Cilandak** pada pencarian kode pos, lalu pilih **12430 — Cilandak Barat**. Pilihan ini langsung muncul pada kalkulator tanpa dikirim sebagai props.
4. Isi berat `2.5` kg. Nilai simulasi untuk rute dalam satu provinsi adalah `Rp 27.000`.
5. Pada React DevTools, buka tab **Components**, pilih **ShipmentProvider**, lalu lihat nilai Context berubah saat wilayah diganti.
6. Untuk melihat penanganan error, putuskan jaringan di tab Network, muat ulang, lalu sambungkan kembali dan klik **Coba lagi**.

`tests/day10-browser.mjs` memeriksa kedua API nyata, perubahan Context lintas komponen, loading, error/retry, pembatalan respons lama, hasil kalkulator, tampilan mobile tanpa overflow horizontal, dan error JavaScript di browser. Screenshot otomatis ada di `evidence/day10-*.png`.
