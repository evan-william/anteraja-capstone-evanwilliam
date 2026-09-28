# Latihan React + Vite — Day 9 sampai Day 11

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

Untuk uji browser otomatis, jalankan `node ../node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173` pada terminal pertama. Pada terminal kedua jalankan `npm run test:day10` (memakai API publik sungguhan) dan `npm run test:day11` (navigasi SPA dan responsivitas). Tangkapan layar akan tersimpan di `evidence/`.

## Pohon komponen dan aliran data

```text
main.tsx
└── BrowserRouter
    └── ShipmentProvider (Context: kiriman, wilayah, kode pos)
        └── App (Routes)
            └── MainLayout (TrackingHeader + Outlet + footer)
                ├── HomePage (ShipmentForm, ShipmentList, ShippingCalculator)
                ├── ShipmentListPage (ShipmentForm, ShipmentList)
                │   └── ShipmentCard × hasil filter
                ├── ShipmentDetailPage (useParams + Context)
                ├── ShippingPage (LocationFields + ShippingCalculator)
                └── NotFoundPage
```

`HomePage` dan `ShipmentListPage` mengelola input pencarian dan filter lewat `useState`. `ShipmentForm` menerima nilai dan callback melalui props. Input resi adalah controlled component: `value={draft}` dan `onChange` mengubah state induk. `ShipmentListPage` meneruskan hasil filter ke `ShipmentList`; komponen ini merender `ShipmentCard` dengan `.map()` dan `key={shipment.id}`. Bila daftar kosong, ia menampilkan empty state. Props tidak dimutasi.

Day 10 menambah `ShipmentProvider` melalui `createContext` dan `useContext`. `LocationFields` (di dalam form) menyimpan provinsi/kota asal, provinsi/kota tujuan, dan kode pos terpilih lewat `useShipmentContext`. `ShippingCalculator` membaca pilihan rute yang sama tanpa props berantai. Berat tetap state lokal kalkulator. Mengganti provinsi membersihkan kota terkait; mengganti kota tujuan juga membersihkan kode pos lama. Day 11 menaruh dataset contoh dalam Context yang sama supaya halaman detail dapat mengambil kiriman sesuai URL. `ShipmentContext.displayName = 'ShipmentContext'` memudahkan identifikasi Provider di React DevTools.

## Route Map SPA (Day 11)

| URL | Halaman | Perilaku |
| --- | --- | --- |
| `/` | `HomePage` | Form resi, pilihan wilayah, daftar contoh, dan simulasi ongkir. Setelah **Cari kiriman**, `useNavigate` membuka `/shipments` dengan filter pada query URL. |
| `/shipments` | `ShipmentListPage` | Daftar dapat dicari dan difilter; pilihan disimpan pada `?q=...&status=...`. Klik kartu membuka detail. |
| `/shipments/:id` | `ShipmentDetailPage` | `useParams` membaca ID/nomor resi dari URL, lalu mencari kiriman di `ShipmentContext`. ID tidak dikenal menampilkan fallback yang aman. |
| `/ongkir` | `ShippingPage` | Form wilayah dan kalkulator membaca rute dari Context yang sama. |
| `*` | `NotFoundPage` | Pesan 404 dengan tautan kembali ke beranda. |

`main.tsx` memasang satu `BrowserRouter`. `App.tsx` mendefinisikan `Routes` dan `Route` di bawah `MainLayout`. Layout merender `TrackingHeader`, `<Outlet />`, dan footer. `Link` pada logo/kartu dan `NavLink` pada menu mengganti halaman tanpa full-page reload; `aria-current="page"` menandai menu aktif. Header/footer tetap terpasang saat isi Outlet berubah. Navigasi pencarian memakai `useNavigate`, bukan `window.location`.

URL `/shipments/ANT-100015` dapat dibuka langsung atau di-refresh pada server Vite karena Vite menyediakan SPA fallback. Bila men-deploy folder `dist/` ke hosting statis lain, atur rewrite semua URL aplikasi ke `index.html`; tanpa rewrite, direct URL bisa menghasilkan 404 dari server sebelum React berjalan.

## API publik dan custom hooks

| Sumber | Kegunaan | Berkas |
| --- | --- | --- |
| [API Wilayah Indonesia v2](https://github.com/emsifa/api-wilayah-indonesia) | Daftar provinsi dan kota/kabupaten untuk asal dan tujuan | `src/services/locationApi.ts`, `src/hooks/useLocationData.ts` |
| [API Kodepos](https://github.com/sooluh/kodepos) | Cari kode pos dengan nama kecamatan/kelurahan | `src/services/locationApi.ts`, `src/hooks/usePostalSearch.ts` |

`locationApi.ts` mengubah respons HTTP menjadi data bertipe dan menolak respons yang tidak sesuai format. `useLocationData(kind, provinceId?)` memuat provinsi atau kota. `usePostalSearch(keyword)` menunggu 400 ms setelah pengguna berhenti mengetik dan hanya mencari bila panjang kueri minimal tiga karakter. Kedua hook memakai `useEffect` dengan dependency yang spesifik, `AbortController`, dan cleanup untuk membatalkan request lama saat pilihan berubah atau komponen dilepas. Masing-masing mengembalikan `data`, `isLoading`, `isError`, `error`, dan `retry`. Pesan loading/error serta tombol **Coba lagi** terlihat pada UI.

Hasil kode pos disaring agar cocok dengan kota tujuan yang dipilih. Karena penyedia API memakai variasi penulisan nama (misalnya DKI Jakarta dan Daerah Khusus Ibukota Jakarta), komponen menormalisasi nama sebelum membandingkan. API Kodepos publik ini digunakan untuk latihan; jangan menganggap ketersediaan atau akurasinya sebagai jaminan produksi.

Kalkulator membaca rute bersama dan memperbarui angka contoh saat berat atau wilayah berubah. **Tarif tersebut simulasi pembelajaran, bukan tarif resmi Anteraja dan tidak melakukan booking pengiriman.**

## Coba saat presentasi

1. Buka beranda dan cari resi `ANT-100015`. Aplikasi berpindah ke `/shipments?q=ANT-100015` tanpa reload. Klik kiriman untuk membuka `/shipments/ANT-100015`.
2. Buka `/shipments/TIDAK-ADA` langsung untuk melihat fallback resi tidak dikenal; buka `/alamat-salah` untuk halaman 404.
3. Coba `ANT-999999` di daftar untuk melihat empty state; gunakan **Reset**.
4. Di beranda atau `/ongkir`, pilih provinsi asal **Daerah Khusus Ibukota Jakarta**, kota **Jakarta Pusat**; pilih tujuan provinsi yang sama, kota **Jakarta Selatan**.
5. Ketik **Cilandak** pada pencarian kode pos, lalu pilih **12430 — Cilandak Barat**. Pilihan ini langsung muncul pada kalkulator tanpa dikirim sebagai props.
6. Isi berat `2.5` kg. Nilai simulasi untuk rute dalam satu provinsi adalah `Rp 27.000`.
7. Pada React DevTools, buka tab **Components**, pilih **ShipmentProvider**, lalu lihat nilai Context berubah saat wilayah diganti.
8. Untuk melihat penanganan error, putuskan jaringan di tab Network, muat ulang, lalu sambungkan kembali dan klik **Coba lagi**.

`tests/day10-browser.mjs` memeriksa kedua API nyata, perubahan Context lintas komponen, loading, error/retry, pembatalan respons lama, hasil kalkulator, tampilan mobile tanpa overflow horizontal, dan error JavaScript di browser. Screenshot otomatis ada di `evidence/day10-*.png`.

`tests/day11-browser.mjs` memeriksa `Link`, `NavLink`, `useNavigate`, header/footer yang tidak diganti saat pindah rute, URL detail langsung dan setelah refresh, ID tak dikenal, wildcard 404, serta semua halaman pada lebar 375, 768, dan 1440 px. Uji menghitung event `DOMContentLoaded` agar navigasi SPA tidak keliru dianggap sebagai reload; ia juga memeriksa warning/error browser. Screenshot ada di `evidence/day11-*.png`.
