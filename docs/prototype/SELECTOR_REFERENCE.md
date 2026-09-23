# Referensi Selector Prototype

Selector berikut disiapkan agar latihan JavaScript atau jQuery berikutnya dapat menargetkan elemen tanpa bergantung pada class styling Tailwind. Gunakan ID untuk satu elemen unik dan class `js-*` untuk pola yang dapat muncul berulang.

## Tracking

| Selector | Elemen | Kegunaan |
|---|---|---|
| `#tracking-search-form` | Form pencarian | Menangani submit tracking |
| `#tracking-number` | Input resi | Membaca dan menormalisasi nomor resi |
| `#tracking-access-code` | Input kode | Membatasi kode akses menjadi enam digit |
| `#track-package-button` | Tombol submit | Menampilkan pending state atau analytics event |
| `.js-tracking-form` | Form pencarian | Hook alternatif berbasis class |

## Autentikasi

| Selector | Elemen | Kegunaan |
|---|---|---|
| `#sign-in-form` | Form masuk | Menangani submit login |
| `#sign-in-submit` | Tombol masuk | Pending state login |
| `#sign-up-form` | Form daftar | Menangani submit pendaftaran |
| `#sign-up-submit` | Tombol daftar | Pending state pendaftaran |

## Seller operations

| Selector | Elemen | Kegunaan |
|---|---|---|
| `#shipment-search` | Input pencarian | Mencari resi, penerima, atau kota |
| `.js-risk-filter` | Kumpulan tombol filter | Mengubah filter risiko |
| `#shipments-table` | Tabel pengiriman | Membaca hasil yang sedang tampil |
| `#export-shipments-csv` | Tombol ekspor | Mengunduh hasil aktif sebagai CSV |
| `#export-shipments-json` | Tombol ekspor | Mengunduh hasil aktif sebagai JSON |

## Rekonsiliasi

| Selector | Elemen | Kegunaan |
|---|---|---|
| `#bank-statement-file` | Input file | Membaca CSV mutasi bank |
| `#save-reconciliation` | Tombol simpan | Menyimpan hasil preview yang valid |

## Contoh jQuery

```javascript
$('#tracking-search-form').on('submit', function (event) {
  const trackingNumber = $('#tracking-number').val();
  console.log('Resi yang diperiksa:', trackingNumber);
});

$('.js-risk-filter').on('click', function () {
  console.log('Filter aktif:', $(this).attr('id'));
});
```

Implementasi React tetap menjadi pemilik state dan business logic saat ini. Selector ini merupakan kontrak DOM untuk latihan interaksi berikutnya, bukan alasan untuk menduplikasi logic React dengan jQuery.
