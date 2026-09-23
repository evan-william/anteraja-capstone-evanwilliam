# Dokumentasi Prototype Anteraja

Prototype ini mengubah rancangan UI menjadi halaman Next.js yang saling terhubung. Tracking menjadi alur publik utama. Setelah masuk, seller dapat membuka Pengiriman, Arus Dana, Rekonsiliasi, dan Kategori melalui navigasi yang sama.

## Menjalankan prototype

1. Buka terminal di root repository.
2. Instal dependency:

   ```bash
   npm install
   ```

3. Salin `.env.example` menjadi `.env.local`, lalu isi URL dan publishable key Supabase.
4. Jalankan database lokal atau project development sesuai `database/DATABASE_RUN.md`.
5. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

6. Buka `http://localhost:3000/lacak`.

Gunakan resi `ANT-100015` dan kode akses `260926` untuk mencoba FR tracking. Akun seller demo memakai `demo@contoh.test` dengan password `demo12345`.

## Hubungan antarhalaman

```text
/lacak
  -> /lacak/[awb]
     -> perbaikan alamat / jadwal ulang / safe drop
     -> notifikasi
     -> tiket CS

/masuk atau /daftar
  -> /pengiriman
     -> /pengiriman/[awb]
  -> /transaksi
  -> /import
  -> /kategori
```

Navigasi publik menyediakan akses ke tracking dan ruang seller. Navigasi setelah login menempatkan Pengiriman dan Lacak Paket sebagai menu operasi, sementara Arus Dana, Rekonsiliasi, dan Kategori berada dalam kelompok Finance.

## Semantic HTML

Implementasi memakai elemen native sesuai fungsinya:

- `<header>` dan `<nav>` untuk identitas serta navigasi.
- `<main id="main-content">` sebagai tujuan skip link pada setiap halaman utama.
- `<section>` untuk kelompok informasi dengan heading atau accessible label.
- `<article>` untuk satu unit informasi yang dapat dibaca mandiri.
- `<form>`, `<label>`, `<input>`, `<select>`, dan `<button>` untuk interaksi.
- `<table>`, `<caption>`, `<thead>`, `<tbody>`, dan `<th scope="col">` untuk data operasional.
- `<ol>` untuk timeline pengiriman dan `<dl>` untuk pasangan label-nilai.
- `<aside>` untuk konteks tambahan yang mendukung konten utama.

Semua navigasi memakai `<a>` melalui Next.js `Link`. Tombol filter dan aksi memakai `<button>`, bukan elemen generik dengan click handler.

## JSON-LD

Halaman `/lacak` memuat satu blok JSON-LD bertipe [`WebApplication`](https://schema.org/WebApplication). Data terstruktur menjelaskan nama aplikasi, kategori, dukungan browser, bahasa, dan daftar fitur. Script memakai serializer yang mengganti karakter `<` sebelum disisipkan ke HTML.

## Responsivitas

Layout dimulai dari layar 320 px dan berkembang melalui breakpoint Tailwind:

| Rentang | Perilaku utama |
|---|---|
| Mobile | Navigasi memakai menu terbuka, form tersusun vertikal, tabel dapat digulir horizontal |
| `sm` | Form dan ringkasan mulai memakai dua kolom bila ruang cukup |
| `md` | Navigasi desktop aktif dan blok informasi mulai berdampingan |
| `lg` | Halaman tracking, dashboard, serta Finance memakai grid desktop |
| `xl` | Filter, pencarian, dan ekspor berada dalam satu baris tanpa memotong kontrol |

Input memakai ukuran teks minimal 16 px pada mobile untuk mencegah zoom otomatis. Focus ring terlihat, touch target menu mobile memiliki tinggi minimal 44 px, dan `prefers-reduced-motion` mematikan motion non-esensial.

## Dokumen pendukung

- [Pemetaan halaman ke FRD](PAGE_FRD_MAPPING.md)
- [Referensi selector](SELECTOR_REFERENCE.md)
- [PRD terpadu](../product/prd.md)
- [FRD terpadu](../product/frd.md)
- [Desain UI](../design/ui-design.md)
