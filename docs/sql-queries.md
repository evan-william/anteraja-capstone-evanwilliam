# SQL: Analisis Data Pengiriman

Query SQL mentah dijalankan melalui PDO SQLite, tanpa Eloquent; seluruh tabel di bawah adalah output eksekusi nyata.

- Branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/sql-analysis
- Eksekusi UTC: 2026-10-02T06:51:46Z; SQLite 3.39.2.
- Database latihan: 5 kurir, 20 kiriman, 3 status, 15 kiriman bulan ini.
- Rentang bulan: `2026-10-01 00:00:00` inklusif sampai `2026-11-01 00:00:00` eksklusif.
- Schema diimpor ulang dari struktur latihan Laravel CRUD sebelumnya; Supabase dan database sebelumnya tidak diubah.

## Data dan asumsi

Schema mempertahankan nama kolom, relasi, dan tiga status latihan sebelumnya, dengan CHECK tambahan untuk berat/status/rating. Fixture memasukkan batas 1 kg dan 5 kg, bulan sebelumnya, batas awal bulan depan, serta Bima Santoso tanpa shipment. Data bulan depan merupakan fixture batas tanggal, bukan klaim pengiriman nyata. Bulan ini berarti bulan penuh menurut `created_at`, bukan hanya month-to-date atau tanggal delivered.

## Q01 - Dalam perjalanan, terberat dahulu

Menampilkan kiriman in_transit dari berat terbesar dengan ID sebagai pemecah urutan jika berat sama.

```sql
SELECT id, tracking_number, weight_kg, status, courier_id
FROM shipments
WHERE status = 'in_transit'
ORDER BY weight_kg DESC, id ASC;
```

Hasil nyata (8 baris):

| id | tracking_number | weight_kg | status | courier_id |
| --- | --- | --- | --- | --- |
| 12 | ANT-SQL-0012 | 12 | in_transit | 3 |
| 10 | ANT-SQL-0010 | 8 | in_transit | 2 |
| 4 | ANT-SQL-0004 | 5 | in_transit | 1 |
| 7 | ANT-SQL-0007 | 2.5 | in_transit | 2 |
| 16 | ANT-SQL-0016 | 1.25 | in_transit | 1 |
| 2 | ANT-SQL-0002 | 1 | in_transit | 1 |
| 14 | ANT-SQL-0014 | 0.999 | in_transit | 4 |
| 19 | ANT-SQL-0019 | 0.6 | in_transit | 3 |

## Q02 - Kategori ukuran menggunakan CASE

Mengelompokkan berat menjadi Small (<=1 kg), Medium (>1 sampai 5 kg), atau Large (>5 kg).

```sql
SELECT id, tracking_number, weight_kg,
    CASE
        WHEN weight_kg <= 1 THEN 'Small'
        WHEN weight_kg <= 5 THEN 'Medium'
        ELSE 'Large'
    END AS size_category
FROM shipments
ORDER BY id ASC;
```

Hasil nyata (20 baris):

| id | tracking_number | weight_kg | size_category |
| --- | --- | --- | --- |
| 1 | ANT-SQL-0001 | 0.5 | Small |
| 2 | ANT-SQL-0002 | 1 | Small |
| 3 | ANT-SQL-0003 | 1.001 | Medium |
| 4 | ANT-SQL-0004 | 5 | Medium |
| 5 | ANT-SQL-0005 | 5.001 | Large |
| 6 | ANT-SQL-0006 | 10 | Large |
| 7 | ANT-SQL-0007 | 2.5 | Medium |
| 8 | ANT-SQL-0008 | 0.75 | Small |
| 9 | ANT-SQL-0009 | 3 | Medium |
| 10 | ANT-SQL-0010 | 8 | Large |
| 11 | ANT-SQL-0011 | 0.25 | Small |
| 12 | ANT-SQL-0012 | 12 | Large |
| 13 | ANT-SQL-0013 | 4 | Medium |
| 14 | ANT-SQL-0014 | 0.999 | Small |
| 15 | ANT-SQL-0015 | 6 | Large |
| 16 | ANT-SQL-0016 | 1.25 | Medium |
| 17 | ANT-SQL-0017 | 2 | Medium |
| 18 | ANT-SQL-0018 | 7 | Large |
| 19 | ANT-SQL-0019 | 0.6 | Small |
| 20 | ANT-SQL-0020 | 5 | Medium |

## Q03 - Total pengiriman per kurir bulan ini

Menghitung shipment yang dibuat pada bulan kalender UTC berjalan per kurir, termasuk kurir dengan hasil nol.

```sql
SELECT c.id AS courier_id, c.name AS courier_name,
    COUNT(s.id) AS total_shipments_this_month
FROM couriers AS c
LEFT JOIN shipments AS s
    ON s.courier_id = c.id
    AND s.created_at >= datetime('now', 'start of month')
    AND s.created_at < datetime('now', 'start of month', '+1 month')
GROUP BY c.id, c.name
ORDER BY total_shipments_this_month DESC, c.id ASC;
```

Hasil nyata (5 baris):

| courier_id | courier_name | total_shipments_this_month |
| --- | --- | --- |
| 1 | Dimas Pratama | 6 |
| 2 | Ayu Lestari | 4 |
| 3 | Rizky Saputra | 3 |
| 4 | Nadia Putri | 2 |
| 5 | Bima Santoso | 0 |

## Q04 - Rata-rata berat per status

Menghitung jumlah dan rata-rata berat semua shipment per status dengan tiga digit desimal.

```sql
SELECT status, COUNT(*) AS total_shipments,
    ROUND(AVG(weight_kg), 3) AS average_weight_kg
FROM shipments
GROUP BY status
ORDER BY status ASC;
```

Hasil nyata (3 baris):

| status | total_shipments | average_weight_kg |
| --- | --- | --- |
| delivered | 7 | 2.857 |
| in_transit | 8 | 3.919 |
| pending | 5 | 4.9 |

## Q05 - Kurir dengan lebih dari N pengiriman

Menampilkan kurir dengan jumlah shipment seluruh periode lebih dari N=4 menggunakan HAVING.

```sql
WITH parameters(n) AS (VALUES (4))
SELECT c.id AS courier_id, c.name AS courier_name,
    COUNT(s.id) AS total_shipments
FROM couriers AS c
INNER JOIN shipments AS s ON s.courier_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(s.id) > (SELECT n FROM parameters)
ORDER BY total_shipments DESC, c.id ASC;
```

Hasil nyata (3 baris):

| courier_id | courier_name | total_shipments |
| --- | --- | --- |
| 1 | Dimas Pratama | 7 |
| 2 | Ayu Lestari | 6 |
| 3 | Rizky Saputra | 5 |

## Q06 - Semua kurir termasuk yang belum memiliki kiriman

Mempertahankan semua kurir dengan LEFT JOIN dan menghitung shipment terkait, termasuk nol.

```sql
SELECT c.id AS courier_id, c.name AS courier_name,
    COUNT(s.id) AS total_shipments
FROM couriers AS c
LEFT JOIN shipments AS s ON s.courier_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id ASC;
```

Hasil nyata (5 baris):

| courier_id | courier_name | total_shipments |
| --- | --- | --- |
| 1 | Dimas Pratama | 7 |
| 2 | Ayu Lestari | 6 |
| 3 | Rizky Saputra | 5 |
| 4 | Nadia Putri | 2 |
| 5 | Bima Santoso | 0 |

## Q07 - Detail kiriman beserta nama kurir melalui INNER JOIN

Menggabungkan setiap shipment dengan nama kurir yang direferensikan melalui INNER JOIN.

```sql
SELECT s.tracking_number, s.weight_kg, s.status,
    c.name AS courier_name
FROM shipments AS s
INNER JOIN couriers AS c ON c.id = s.courier_id
ORDER BY s.id ASC;
```

Hasil nyata (20 baris):

| tracking_number | weight_kg | status | courier_name |
| --- | --- | --- | --- |
| ANT-SQL-0001 | 0.5 | pending | Dimas Pratama |
| ANT-SQL-0002 | 1 | in_transit | Dimas Pratama |
| ANT-SQL-0003 | 1.001 | delivered | Dimas Pratama |
| ANT-SQL-0004 | 5 | in_transit | Dimas Pratama |
| ANT-SQL-0005 | 5.001 | delivered | Dimas Pratama |
| ANT-SQL-0006 | 10 | pending | Dimas Pratama |
| ANT-SQL-0007 | 2.5 | in_transit | Ayu Lestari |
| ANT-SQL-0008 | 0.75 | delivered | Ayu Lestari |
| ANT-SQL-0009 | 3 | pending | Ayu Lestari |
| ANT-SQL-0010 | 8 | in_transit | Ayu Lestari |
| ANT-SQL-0011 | 0.25 | delivered | Rizky Saputra |
| ANT-SQL-0012 | 12 | in_transit | Rizky Saputra |
| ANT-SQL-0013 | 4 | pending | Rizky Saputra |
| ANT-SQL-0014 | 0.999 | in_transit | Nadia Putri |
| ANT-SQL-0015 | 6 | delivered | Nadia Putri |
| ANT-SQL-0016 | 1.25 | in_transit | Dimas Pratama |
| ANT-SQL-0017 | 2 | delivered | Ayu Lestari |
| ANT-SQL-0018 | 7 | pending | Ayu Lestari |
| ANT-SQL-0019 | 0.6 | in_transit | Rizky Saputra |
| ANT-SQL-0020 | 5 | delivered | Rizky Saputra |

## Q08 - Kurir yang belum menerima kiriman melalui NOT EXISTS

Menemukan kurir yang tidak memiliki shipment sama sekali menggunakan NOT EXISTS.

```sql
SELECT c.id AS courier_id, c.name AS courier_name
FROM couriers AS c
WHERE NOT EXISTS (
    SELECT 1 FROM shipments AS s WHERE s.courier_id = c.id
)
ORDER BY c.id ASC;
```

Hasil nyata (1 baris):

| courier_id | courier_name |
| --- | --- |
| 5 | Bima Santoso |

## Mengapa query ini benar

- `WHERE` menyaring baris sebelum agregasi; `HAVING` menyaring hasil grup setelah agregasi. N dapat diubah pada `VALUES (4)`; ini query SQL lengkap tanpa placeholder yang belum diisi.
- `GROUP BY c.id, c.name` mencantumkan seluruh kolom non-agregat dan tidak menggabungkan dua kurir yang namanya sama.
- `COUNT(s.id)` menghasilkan nol untuk kurir kosong; `COUNT(*)` pada LEFT JOIN akan salah menghitung satu baris NULL sebagai satu shipment.
- Filter tanggal Q03 ditempatkan pada `ON` agar kurir tanpa kiriman bulan ini tetap muncul; batas awal inklusif/akhir eksklusif menangani pergantian bulan/tahun.
- `AVG` memakai berat numerik, bukan penjumlahan yang dibagi jumlah status; pembulatan hanya untuk hasil tampilan.

## Perbandingan Eloquent (referensi, bukan jalur eksekusi)

Contoh ekuivalen Q03 memakai correlated count; bentuk SQL bisa berbeda, tetapi hasil yang diharapkan sama. Contoh ini tidak dijalankan pada latihan SQL mentah.

```php
$start = now('UTC')->startOfMonth();
$end = $start->copy()->addMonth();
$couriers = Courier::query()
    ->withCount(['shipments as total_shipments_this_month' => function ($query) use ($start, $end) {
        $query->where('created_at', '>=', $start)
            ->where('created_at', '<', $end);
    }])
    ->orderByDesc('total_shipments_this_month')
    ->orderBy('id')
    ->get();
```

Jangan melakukan `Courier::all()` lalu query jumlah dalam loop (N+1). Rentang tanggal langsung pada kolom lebih cocok untuk pemanfaatan indeks daripada membungkus setiap tanggal dengan fungsi month. Query plan dan ukuran data tetap perlu diukur sebelum menyatakan percepatan.

## Cara menjalankan

Dari root repository: `& C:\xampp\php\php.exe exercises/sql-analysis/run.php`. Script membuat database baru di memori dan menghasilkan ulang dokumen/output; tidak menghapus database lama. Tambahkan `--save-db` untuk menyimpan analysis.sqlite jika file itu belum ada. Semua query ada di `exercises/sql-analysis/queries.sql`. Dialek tanggal SQLite tidak dapat ditempel langsung ke PostgreSQL/MySQL tanpa adaptasi.

## Pengujian aktual

40 pemeriksaan lulus:

```text
PASS: 20 shipment dummy
PASS: 5 courier dummy
PASS: foreign key aktif
PASS: tidak ada orphan foreign key
PASS: integritas SQLite
PASS: Q01 hanya 8 in_transit
PASS: Q01 status tepat
PASS: Q01 berat descending
PASS: Q02 seluruh shipment
PASS: CASE batas 1 kg Small
PASS: CASE 1.001 kg Medium
PASS: CASE batas 5 kg Medium
PASS: CASE 5.001 kg Large
PASS: CASE distribusi 6/8/6
PASS: Q03 jumlah bulan ini 6/4/3/2/0
PASS: Q03 total bulan ini 15
PASS: bulan mencakup tepat batas awal
PASS: bulan menolak satu detik sebelum awal
PASS: bulan menolak tepat awal bulan depan
PASS: bulan tidak mencampur bulan sebelumnya/depan
PASS: Q04 tiga status
PASS: Q04 count pending
PASS: Q04 AVG pending
PASS: Q04 count in_transit
PASS: Q04 AVG in_transit
PASS: Q04 count delivered
PASS: Q04 AVG delivered
PASS: HAVING N=4 menghasilkan 3 kurir
PASS: HAVING lebih dari 6, bukan lebih dari atau sama
PASS: HAVING N=20 hasil kosong yang valid
PASS: LEFT JOIN 7/6/5/2/0
PASS: LEFT JOIN total sama dengan jumlah shipment
PASS: INNER JOIN memuat seluruh 20 shipment
PASS: INNER JOIN relasi kurir tepat
PASS: NOT EXISTS kurir kosong tepat
PASS: courier invalid ditolak
PASS: tracking number duplikat ditolak
PASS: berat nol ditolak
PASS: status di luar kontrak ditolak
PASS: kurir terpakai tidak dapat dihapus
```

## Git dan review

Minimal tiga commit modular disiapkan untuk fixture, query/pengujian, dan dokumentasi. Bukti hash aktual disimpan pada paket pengumpulan Day 15. Reviewer tidak diminta sesuai arahan pemilik; review persetujuan dan merge tidak diklaim telah dilakukan.

## Referensi

- [SQLite SELECT, JOIN, GROUP BY dan HAVING](https://www.sqlite.org/lang_select.html)
- [SQLite date/time dan UTC](https://www.sqlite.org/lang_datefunc.html)
