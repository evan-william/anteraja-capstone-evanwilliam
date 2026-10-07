# Analisis bottleneck hub - Day 18

## Hasil utama

HUB_REMOTE memiliki rata-rata tertinggi 30.00 jam, tetapi hanya 2 pasangan valid dari 19 (10.53%). Prioritas investigasi operasional adalah HUB_MKS, dengan 350 paket valid, rata-rata 11.17 jam, median 11.38 jam, dan kualitas pasangan 95.37%; median yang mendekati rata-rata menunjukkan waktu tunggu tinggi bukan hanya satu outlier. Periksa kapasitas sorting per shift, antrean departure, jam cut-off, serta sinkronisasi jam scanner; audit missing/duplicate scan sebelum menyimpulkan penyebab. Angka simulasi ini mendukung prioritas pemeriksaan, bukan bukti kausal atau klaim performa Anteraja sebenarnya.

| Hub | Paket valid | Mean (jam) | Median (jam) | Valid pair |
|---|---:|---:|---:|---:|
| HUB_REMOTE | 2 | 30.000 | 30.000 | 10.53% |
| HUB_MKS | 350 | 11.168 | 11.380 | 95.37% |
| HUB_DPS | 200 | 8.961 | 8.880 | 92.17% |
| HUB_SMG | 250 | 7.077 | 7.095 | 93.63% |
| HUB_MED | 180 | 6.137 | 6.285 | 91.37% |

## Dataset dan schema

Dataset **simulasi** deterministik seed 1818, periode September 2026 UTC. Ini bukan
data Supabase atau pengiriman pelanggan. Generator mengeluarkan 4598
baris event pada delapan hub; package yang sama bisa melewati hub berbeda.
Kolom hub_id, package_id, event_type dan timestamp mula-mula string agar timestamp
rusak tetap dapat diaudit; timestamp sah di-parse menjadi Spark TimestampType UTC.
event_type sah: ARRIVAL dan DEPARTURE. Input berada di `../data/scan_events.csv`.
`ground_truth.json` hanya dipakai validator, tidak oleh perhitungan Spark.

## Data quality check

```json
{
  "raw_events": 4598,
  "deduplicated_events": 4574,
  "duplicate_extra_events": 24,
  "missing_key_events": 2,
  "invalid_timestamp_events": 24,
  "candidate_pairs": 2318,
  "valid_pairs": 2182,
  "missing_arrival_pairs": 40,
  "missing_departure_pairs": 40,
  "invalid_timestamp_pairs": 24,
  "unknown_event_pairs": 8,
  "ambiguous_pair_pairs": 8,
  "departure_before_arrival_pairs": 16,
  "excluded_pairs": 136
}
```

Duplikat exact dihapus berdasarkan keempat kolom; salinan tambahan tetap dicatat
per hub. Dua scan tanpa kunci dikeluarkan dari pairing dan dilaporkan terpisah.
Missing arrival/departure berarti event tersebut tidak ada setelah deduplikasi,
bukan timestamp rusak. Grup dengan timestamp rusak tidak dianggap missing scan.
Flag masalah dapat overlap; `excluded_pairs` menghitung grup unik, bukan jumlah flag.
Pair harus tepat satu ARRIVAL dan satu DEPARTURE sah, tanpa event asing atau urutan
terbalik. Kunjungan berulang ditandai ambigu, tidak dipasangkan menggunakan min/max.
Zero dwell diperbolehkan; outlier tidak dibuang hanya karena lama.

## Kode PySpark yang dijalankan

Kode sumber lengkap berada di `../analysis/spark_analysis.py` dan dipanggil notebook.
Seluruh input, pairing, filter, group, aggregate dan sort memakai Spark.

```python
"""Spark transformations shared by the executed notebook and independent tests."""
import csv
import json
from pathlib import Path
from pyspark.sql import functions as F, types as T

FIELDS = ["hub_id", "package_id", "event_type", "timestamp"]
SCHEMA = T.StructType([T.StructField(name, T.StringType(), True) for name in FIELDS])


def quality_check(raw):
    """Keep invalid scans in group audits; reject ambiguous visits conservatively."""
    assert raw.columns == FIELDS, f"Unexpected columns: {raw.columns}"
    assert all(isinstance(f.dataType, T.StringType) for f in raw.schema.fields)
    missing_key = (F.col("hub_id").isNull() | (F.trim("hub_id") == "") |
                   F.col("package_id").isNull() | (F.trim("package_id") == ""))
    distinct = raw.dropDuplicates(FIELDS)
    keyed = distinct.filter(~missing_key).withColumn(
        "parsed_at", F.try_to_timestamp("timestamp", F.lit("yyyy-MM-dd'T'HH:mm:ss'Z'")))
    groups = keyed.groupBy("hub_id", "package_id").agg(
        F.sum(F.when(F.col("event_type") == "ARRIVAL", 1).otherwise(0)).alias("arrival_count"),
        F.sum(F.when(F.col("event_type") == "DEPARTURE", 1).otherwise(0)).alias("departure_count"),
        F.sum(F.when(F.col("parsed_at").isNull(), 1).otherwise(0)).alias("invalid_timestamp_count"),
        F.sum(F.when(F.col("event_type").isin("ARRIVAL", "DEPARTURE"), 0).otherwise(1)).alias("unknown_event_count"),
        F.min(F.when(F.col("event_type") == "ARRIVAL", F.col("parsed_at"))).alias("arrival_at"),
        F.min(F.when(F.col("event_type") == "DEPARTURE", F.col("parsed_at"))).alias("departure_at"))
    flags = {
        "missing_arrival": F.col("arrival_count") == 0,
        "missing_departure": F.col("departure_count") == 0,
        "invalid_timestamp": F.col("invalid_timestamp_count") > 0,
        "unknown_event": F.col("unknown_event_count") > 0,
        "ambiguous_pair": (F.col("arrival_count") > 1) | (F.col("departure_count") > 1),
        "departure_before_arrival": F.coalesce(F.col("departure_at") < F.col("arrival_at"), F.lit(False)),
    }
    for name, condition in flags.items():
        groups = groups.withColumn(name, condition)
    eligible = F.lit(True)
    for name in flags:
        eligible = eligible & ~F.col(name)
    groups = groups.withColumn("is_valid_pair", eligible).cache()
    duplicates = raw.groupBy(FIELDS).count().filter(F.col("count") > 1)
    duplicate_hubs = duplicates.filter(~missing_key).groupBy("hub_id").agg(
        F.sum(F.col("count") - 1).alias("duplicate_extra_events"))
    quality = groups.groupBy("hub_id").agg(
        F.count("*").alias("candidate_pairs"),
        F.sum(F.col("is_valid_pair").cast("int")).alias("valid_pairs"),
        *[F.sum(F.col(n).cast("int")).alias(n) for n in flags]).join(
            duplicate_hubs, "hub_id", "left").fillna(0, ["duplicate_extra_events"]).withColumn(
                "valid_pair_pct", 100 * F.col("valid_pairs") / F.col("candidate_pairs"))
    summary = {"raw_events": raw.count(), "deduplicated_events": distinct.count(),
               "duplicate_extra_events": raw.count() - distinct.count(),
               "missing_key_events": raw.filter(missing_key).count(),
               "invalid_timestamp_events": keyed.filter(F.col("parsed_at").isNull()).count(),
               "candidate_pairs": groups.count(),
               "valid_pairs": groups.filter("is_valid_pair").count()}
    for flag in flags:
        summary[flag + "_pairs"] = groups.filter(F.col(flag)).count()
    summary["excluded_pairs"] = summary["candidate_pairs"] - summary["valid_pairs"]
    return groups, quality, summary


def dwell_and_hubs(groups, quality):
    dwell = groups.filter("is_valid_pair").select("hub_id", "package_id", "arrival_at", "departure_at").withColumn(
        "dwell_hours", (F.unix_timestamp("departure_at") - F.unix_timestamp("arrival_at")) / 3600)
    hubs = dwell.groupBy("hub_id").agg(
        F.count("*").alias("package_count"),
        F.avg("dwell_hours").alias("avg_dwell_hours"),
        F.expr("percentile(dwell_hours, 0.5)").alias("median_dwell_hours")
    ).join(quality, "hub_id").orderBy(F.desc("avg_dwell_hours"), "hub_id")
    return dwell, hubs


def write_csv(frame, path):
    # Stream output to disk instead of collecting all package rows into driver RAM.
    with Path(path).open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=frame.columns)
        writer.writeheader()
        for row in frame.toLocalIterator():
            writer.writerow(row.asDict())


def export_results(groups, quality, summary, output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    dwell, hubs = dwell_and_hubs(groups, quality)
    write_csv(dwell.orderBy("hub_id", "package_id"), output / "package_dwell.csv")
    write_csv(groups.orderBy("hub_id", "package_id"), output / "pair_audit.csv")
    write_csv(quality.orderBy("hub_id"), output / "hub_quality.csv")
    write_csv(hubs, output / "all_hubs.csv")
    write_csv(hubs.limit(5), output / "top_bottleneck_hubs.csv")
    (output / "quality_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return dwell, hubs

```

## Hasil dwell per package x hub

2182 pasangan valid dan 136 grup tidak
valid. Seluruh hasil ada di `../output/package_dwell.csv`; audit termasuk pasangan
yang dikeluarkan ada di `../output/pair_audit.csv`. Satuan jam: beda epoch detik /3600.
Agregasi exact median menggunakan percentile 0.5, bukan approximate percentile.
Urutan penuh mean descending ada di `../output/all_hubs.csv`.

## Top lima dan prioritas

| Hub | Paket valid | Mean (jam) | Median (jam) | Valid pair |
|---|---:|---:|---:|---:|
| HUB_REMOTE | 2 | 30.000 | 30.000 | 10.53% |
| HUB_MKS | 350 | 11.168 | 11.380 | 95.37% |
| HUB_DPS | 200 | 8.961 | 8.880 | 92.17% |
| HUB_SMG | 250 | 7.077 | 7.095 | 93.63% |
| HUB_MED | 180 | 6.137 | 6.285 | 91.37% |

HUB_REMOTE tertinggi tetapi sampelnya dua dan validitas rendah. Aturan eksploratif
prioritas operasi memakai >=100 pasangan valid, valid pair >=90%, kemudian mean
tertinggi: HUB_MKS. Ambang ini aturan latihan, bukan SLA perusahaan. Missing scan
bisa menimbulkan bias seleksi; jangan menyimpulkan bottleneck sebagai sebab pasti.

## 5 Vs dan batas Pandas

Volume: scan tumbuh mengikuti paket dan jumlah kunjungan hub. Velocity: scan datang
terus; notebook ini batch. Variety: CSV, JSON dan GPS; latihan dibatasi CSV.
Veracity: missing/duplicate/time rusak mengubah analisis. Value: menentukan prioritas
investigasi berdasarkan bukti. Pandas normal dibatasi RAM satu mesin; chunking
tidak otomatis mendistribusikan group/join atau memberi fault tolerance. Spark
mempartisi pekerjaan dan dapat berjalan pada cluster; local[2] di sini bukan
benchmark cluster. Hindari collect raw data, simpan produksi ke Parquet terpartisi,
dan pertimbangkan approximate median dengan akurasi eksplisit pada skala besar.

## Pengujian dan batas bukti

Notebook telah dieksekusi memakai PySpark 4.0.1 lokal. 65 pemeriksaan
independen stdlib lulus untuk semua pair, mean, median, ranking dan quality counts;
10 assertion Spark edge-case lulus termasuk dataset kosong, null, dwell nol,
timestamp rusak, urutan terbalik, event asing, dan beberapa kunjungan. Semua code
cell memiliki execution_count dan tidak mempunyai output error. Notebook siap
Colab, tetapi laporan tidak mengklaim sudah dijalankan di akun Google pengguna.
Tidak ada schema database, backend, atau data pelanggan yang diubah.

## Referensi

- [Instalasi PySpark](https://spark.apache.org/docs/4.0.1/api/python/getting_started/install.html)
- [Fungsi Spark SQL](https://spark.apache.org/docs/4.0.1/api/python/reference/pyspark.sql/functions.html)

Branch: https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/feature/bigdata-bottleneck-hubs
Status PR dicantumkan di PDF dan CARA_SUBMIT.txt; review/merge belum terpenuhi tanpa
persetujuan reviewer yang nyata.
