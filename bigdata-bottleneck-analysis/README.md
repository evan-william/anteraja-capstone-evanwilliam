# Delivery Bottleneck Hubs

Latihan Day 18 memakai PySpark 4.0.1 untuk menganalisis scan simulasi; tidak menyentuh
database aplikasi. [Laporan lengkap](docs/bigdata-bottleneck-analysis.md).

## Jalankan di Google Colab

1. Buka https://colab.research.google.com dan Upload notebook `analysis/bottleneck_analysis.ipynb`.
2. Upload `analysis/spark_analysis.py`, `analysis/generate_dataset.py`,
   `analysis/prepare_runtime.py`, dan `data/scan_events.csv`
   ke panel Files pada direktori `/content`, bukan Google Drive mount.
3. Pilih Runtime > Run all. Cell awal memasang PySpark jika belum tersedia.
4. Buka folder output untuk CSV ranking, audit, dwell, grafik dan insight.
   Jika CSV tidak diupload, generator membentuk data identik; jangan campur versi CSV.

## Jalankan lokal

Gunakan Python 3.10+ dan Java 17. Dari folder latihan:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe analysis/generate_dataset.py
```

Buka notebook memakai kernel venv lalu Run all. Sesudah notebook selesai:

```powershell
.\.venv\Scripts\python.exe analysis/verify_results.py
.\.venv\Scripts\python.exe analysis/test_edge_cases.py
```

Notebook memakai prepare_runtime.py untuk jalur junction sementara pada Windows
agar spasi dan & tidak merusak launcher bawaan Spark; tidak menyalin runtime.
Notebook mencari Java 17 lokal jika tersedia pada lokasi Eclipse Adoptium yang
dicantumkan; pada mesin lain atur JAVA_HOME ke instalasi Java 17 Anda sebelum
menjalankan. Spark stop dan unpersist tersedia pada cell terakhir.
CSV export tunggal ditujukan untuk latihan; produksi sebaiknya Spark write Parquet
terpartisi. Ground truth bukan input analisis, hanya pembanding pengujian.
