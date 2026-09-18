# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Anteraja Shipment Tracking Widget (MVP)

---

| Document Parameter | Specification Details |
| :--- | :--- |
| **Product Name** | Anteraja Shipment Tracking Widget (MVP) |
| **Document Version** | 1.0 (Final Comprehensive Release) |
| **Author** | Evan William (Maxy Academy - Module 1) |
| **Target Launch Date** | 16 September 2026 |
| **Document Status** | Approved for MVP Implementation |
| **Target Segment** | Last-Mile E-Commerce Logistics (Indonesia) |

---

## 1. RINGKASAN EKSEKUTIF & PROPOSISI NILAI

### 1.1 Visi Produk
Anteraja Shipment Tracking Widget MVP dirancang untuk mentransformasi antarmuka pelacakan paket Anteraja dari sekadar **daftar riwayat status pasif** (*passive status log*) menjadi sebuah **alat resolusi mandiri proaktif** (*proactive self-service resolution tool*). 

Dengan tagline strategi **-Dari Status Paket menuju Kepastian Pengiriman-**, produk ini berfokus pada penyampaian kepastian, transparansi alasannya keterlambatan, dan pemberian hak intervensi langsung kepada pengguna (*recipient* dan *seller*) saat pengiriman mengalami deviasi dari *Service Level Agreement* (SLA).

### 1.2 Core Value Proposition
> *-Saya tidak hanya tahu paket ada di mana; saya tahu apakah paket masih sesuai janji, mengapa terjadi perubahan, dan apa yang bisa saya lakukan sekarang secara langsung tanpa harus menunggu atau mengejar Customer Service.-*

---

## 2. LATAR BELAKANG BISNIS & STRATEGI PASAR

### 2.1 Lanskap Pasar E-Commerce & Logistik Indonesia
* **Pertumbuhan Transaksi**: Menurut data Kementerian Perdagangan RI (2024-2025), nilai transaksi *e-commerce* Indonesia mencapai Rp1.288,93 triliun pada tahun 2024 (tumbuh 17,08% YoY) dan diproyeksikan mencapai *Gross Merchandise Value* (GMV) sebesar US$71 miliar pada tahun 2025.
* **Dominasi Usaha Mikro**: Sebanyak 97,38% pelaku Penyelenggara Perdagangan Through Sistem Elektronik (PMSE) merupakan usaha mikro (*micro-SMEs*) yang sangat bergantung pada saluran pesan instan dan *social commerce*. Penjual skala mikro ini memerlukan alat pelacakan yang transparan, dibagikan dengan 1 tautan URL (*shareable link*), dan memiliki antarmuka di bawah 3 klik.
* **Tingkat Persaingan Kurir**: Pasar ekspedisi sangat padat (didominasi JNE, SiCepat, GoSend, J&T, dan Anteraja). Dalam persaingan yang ketat ini, penambahan opsi layanan (*Same Day*, *Next Day*, *Regular*) atau perang harga murah saja tidak cukup bertahan lama (*defensible*). Pengalaman pemulihan masalah (*problem recovery*) saat terjadi keterlambatan menjadi titik diferensiasi utama yang dapat meningkatkan retensi pengguna.

### 2.2 Relevansi Bisnis Anteraja (PT Tri Adi Bersama / ASSA Group)
* **Ekosistem & Volume**: Anteraja berada di bawah naungan PT Tri Adi Bersama (anak perusahaan PT Adi Sarana Armada Tbk / ASSA). Laporan Keuangan ASSA 2024 mencatat segmen logistik *end-to-end* tumbuh 15,6% mencapai Rp1,9 triliun. Riset Samuel Sekuritas (2024) mengestimasi volume ambang batas profitabilitas Anteraja berada pada kisaran 460.000-550.000 paket per hari.
* **Unit Economics Impact**: Profitabilitas bisnis logistik sangat sensitif terhadap:
  1. *First-attempt delivery success rate* (keberhasilan antar pada percobaan pertama).
  2. Biaya pengantaran ulang (*redelivery cost*).
  3. Tingkat retur (*return-to-seller rate*).
  4. Biaya penanganan komplain di Customer Service (CS).
* **Kesimpulan Bisnis**: Solusi yang mampu memitigasi kegagalan pengantaran dan menekan kontak komplain *Where Is My Order* (WISMO) secara langsung akan memperkuat *unit economics* dan margin kotor perusahaan.

### 2.3 Matriks SWOT Produk
| Strengths (Kekuatan) | Weaknesses (Kelemahan) |
| :--- | :--- |
| - Jangkauan pengiriman nasional.<br>- Bagian dari ekosistem logistik ASSA.<br>- Dukungan kapabilitas API & aplikasi mobile modern.<br>- Opsi *free pickup* tanpa minimum paket. | - Persepsi publik terkait penanganan *exception* belum konsisten.<br>- Ketergantungan tinggi pada disiplin *scan event* operasional di lapangan. |
| **Opportunities (Peluang)** | **Threats (Ancaman)** |
| - Tingginya pertumbuhan *social commerce* & mikro-UMKM.<br>- Kebutuhan pasar akan visibilitas *real-time* berbasis tindakan.<br>- Potensi *cost avoidance* dari biaya operational CS. | - Perang harga ekstrem antar jasa ekspedisi.<br>- *Captive logistics* dari *marketplace* raksasa.<br>- Ekspektasi SLA pengguna yang semakin tinggi. |

---

## 3. RISET PENGGUNA & PROBLEM STATEMENT

### 3.1 Bukti Riset Pengguna (Triangulasi 4 Tingkat Bukti)
Rancangan produk ini didasarkan pada metodologi triangulasi bukti dari empat sumber data utama:
1. **Bukti Utama (Riset UGM 2025)**: Analisis *Topic Modeling* (kombinasi LDA & BERT Embedding) terhadap **6.451 ulasan Google Play Anteraja** (2023-2024) oleh Balqis Ima Khariyah (UGM) menghasilkan *Silhouette Coefficient* 0,7342. Tiga klaster pembicaraan utama mencakup: *Customer Service & Technical Issues*, *Delivery Speed & Efficiency*, dan *Positive User Experience*.
2. **Bukti Terkini (App Store Snapshots 2026)**: Per 15 September 2026, aplikasi Anteraja di Google Play memiliki rating **3,0/5,0** (78,3 ribu ulasan) dan App Store memiliki rating **3,9/5,0** (9,3 ribu ulasan). Tema ulasan negatif didominasi oleh paket tertunda/dikembalikan tanpa kontak jelas, sedangkan ulasan positif memuji tingkat penyelesaian tugas (task completion rate) aplikasi.
3. **Bukti Operasional (Studi Proses ULBI 2025)**: Penelitian Wira Syah Falanta (ULBI) pada Staging Sukasari Anteraja mengidentifikasi 3 akar penyebab utama keterlambatan (*delay*): *late start handling time*, *unnecessary activity*, dan *waiting time*.
4. **Bukti Konteks Historis (Data YLKI)**: Data historis YLKI/Databoks mencatat aduan ekspedisi sebagai pemicu komplain, menegaskan pentingnya saluran resolusi di bawah 2 jam.

### 3.2 Problem Statement Resmi
> **-Ketika pickup atau pengiriman berisiko melewati janji layanan (SLA), penerima paket dan seller belum selalu memperoleh status yang cukup segar, penjelasan yang jelas tanpa istilah teknis operasional, serta tindakan penyelesaian dalam satu alur terpadu. Akibatnya, mereka harus mengecek berulang kali atau menghubungi customer service, sementara tim operasi menerima eskalasi setelah masalah membesar.-**

### 3.3 Dampak Problem pada Stakeholder
* **Penerima Paket**: Mengalami ketidakpastian waktu tiba, risiko gagal terima paket, dan penurunan rasa percaya (*trust*).
* **Seller / UMKM**: Menerima komplain pembeli, risiko ulasan buruk toko, ancaman *refund/retur*, dan waktu operasional tersita.
* **Customer Service (CS)**: Memproses kontak *Where Is My Order* (WISMO) berulang kali tanpa konteks kronologi yang lengkap.
* **Kurir & Hub Operasional**: *Exception* keterlambatan terlambat diprioritaskan, memicu *redelivery* yang sia-sia.
* **Manajemen Anteraja**: Biaya penanganan komplain membesar dan janji merek (*brand promise*) melemah.

### 3.4 Profil Persona Pengguna
```
+-----------------------------------------------------------------------------------+
| 1. PENERIMA PAKET (Rina, 28 th - Worker / Shopper)                                |
| - JTBD: Ingin tahu pasti kapan paket sampai dan bisa memperbaiki alamat jika keliru|
| - Pain Point: Status -Failed Delivery- tanpa alasan jelas & kurir tidak menghubungi|
| - Gain Needed: Tombol instan untuk kirim patokan rumah / instruksi titip tetangga |
+-----------------------------------------------------------------------------------+
| 2. SELLER / UMKM (Budi, 34 th - Owner Toko Online)                                |
| - JTBD: Menjaga toko dari rating bintang 1 akibat keterlambatan kurir             |
| - Pain Point: Tidak tahu paket mana yang bermasalah sebelum pembeli marah         |
| - Gain Needed: Dashboard widget sederhana untuk memfilter paket -Berisiko-        |
+-----------------------------------------------------------------------------------+
| 3. CUSTOMER SERVICE AGEN (Dewi, 25 th - CS Support)                               |
| - JTBD: Menyelesaikan tiket komplain WISMO di bawah 5 menit pada kontak pertama       |
| - Pain Point: Harus bertanya kronologi dari awal karena data tracking parsial     |
| - Gain Needed: Tiket eskalasi otomatis yang membawa seluruh payload riwayat resi  |
+-----------------------------------------------------------------------------------+
| 4. KURIR / SATRIA ANTERAJA (Joko, 30 th - Hero Delivery)                           |
| - JTBD: Menyelesaikan pengantaran paket sesuai target rute tanpa bolak-balik      |
| - Pain Point: Alamat tidak jelas / patokan kurang, penerima tidak ada di rumah    |
| - Gain Needed: Menerima update patokan alamat langsung di aplikasi kurir          |
+-----------------------------------------------------------------------------------+
```

---

## 4. KERANGKA KERJA DIKW (DATA - INFORMATION - KNOWLEDGE - WISDOM)

Penerapan kerangka kerja DIKW (Jennifer Rowley) dalam memproses data logistik Anteraja:

```
[WISDOM]      --> Keputusan Proaktif: Tawarkan ubah jadwal, instruksi titik aman, atau eskalasi CS sebelum SLA gagal.
     ^
[KNOWLEDGE]   --> Pola & Aturan: Identifikasi bahwa exception -Alamat tidak ditemukan- memicu 80% WISMO jika tak ditangani dalam 2 jam.
     ^
[INFORMATION] --> Konteks Bermakna: Paket tidak mengalami scan selama 6 jam; status berubah jadi -Berisiko- (Risk SLA).
     ^
[DATA]        --> Event Mentah: Timestamp scan, AWB, Kode Hub, Koordinat GPS, Status -In Transit-, Code Exception.
```

| Layer DIKW | Contoh Atribut Anteraja | Pertanyaan Bisnis | Output Sistem |
| :--- | :--- | :--- | :--- |
| **Data** | `AWB`, `Scan_Time`, `Latitude`, `Longitude`, `Status` | Apa yang terjadi? | *Raw event log* tervalidasi. |
| **Information** | Paket tidak di-scan 6 jam, ETA terlewati, `SLA_Status` = -Berisiko- | Apa konteksnya? | Status & indikator risiko yang transparan. |
| **Knowledge** | Rute/Kecamatan tertentu sering terkendala pada jam tertentu | Pola apa yang berulang? | Aturan bisnis (*rules engine*) & klasifikasi kendala. |
| **Wisdom** | Opsi pembaruan patokan alamat atau instruksi titik aman otomatis | Action apa yang paling bernilai? | Intervensi mandiri proaktif (*self-service action*). |

---

## 5. RUANG LINGKUP PRODUK (MVP VS OUT-OF-SCOPE)

### 5.1 Fitur Utama MVP (In-Scope)
1. **Unified Timeline**: Menerjemahkan kode *scan* internal yang teknis menjadi kalimat bahasa konsumen yang ramah dan jelas tanpa istilah teknis operasional.
2. **SLA Confidence Indicator**: Menampilkan indikator risiko berbasis warna/status:
   * 🟢 **Sesuai Jadwal**: Paket bergerak normal sesuai perkiraan waktu.
   * 🟡 **Berisiko**: Terjadi deviasi waktu/scan yang berpotensi melampaui SLA.
   * 🔴 **Perlu Tindakan**: Terjadi kendala operasional (*exception*) yang membutuhkan tindakan pengguna.
3. **Penjelasan Kendala (*Exception Explanation Engine*)**: Menjelaskan alasan spesifik keterlambatan (misal: *-Alamat tidak ditemukan / Patokan kurang jelas-*).
4. **Formulir Resolusi Mandiri (*Self-Service Resolution*)**: Form interaktif bagi penerima untuk memperbarui informasi patokan jalan/bagian rumah atau memberikan instruksi titik aman (*safe drop point*).
5. **Eskalasi Kontekstual (*Context-Rich CS Escalation*)**: Jika kendala tidak terselesaikan, tombol eskalasi CS akan membentuk tiket yang otomatis membawa seluruh *payload* riwayat AWB.
6. **Notifikasi Proaktif (*Opt-In Dispatcher*)**: Pilihan pendaftaran notifikasi via WhatsApp / Push Notification hanya untuk perubahan status krusial.
7. **Widget Monitoring Seller**: Widget responsif sederhana bagi seller untuk memantau paket bermasalah (*At-Risk filter*).

### 5.2 Fitur Di Luar Scope MVP (Out-of-Scope)
* ❌ *Dynamic Route Optimization* otomatis untuk kendaraan kurir.
* ❌ Prediksi estimasi waktu tiba (ETA) berbasis model *Machine Learning* kompleks (MVP menggunakan *Rules Engine* berbasis aturan baku).
* ❌ *Generative AI Chatbot* tanpa *guardrail*.
* ❌ Perombakan total sistem *core logistics* legacy Anteraja.

### 5.3 Matriks Nilai vs Kompleksitas Prioritas Fitur
```
HIGH VALUE  ^  [1. Unified Timeline]        [3. Form Konfirmasi Alamat]
            |  [2. Penjelasan Kendala]      [4. Tiket CS Kontekstual]
            |                               [5. Widget Seller Monitoring]
            |
LOW VALUE   |                               [6. ML-based ETA Prediction] (TUNDA)
            +------------------------------------------------------------->
               LOW COMPLEXITY                  HIGH COMPLEXITY
```

---

## 6. USER JOURNEY & ALUR PENGALAMAN PENGGUNA

```
[1. User Buka Link / Input AWB] 
         |
[2. System Query Data & Rules Engine]
         |
         +---> Status: -Sesuai Jadwal- 🟢 ---> Display Standard Timeline
         |
         +---> Status: -Berisiko- 🟡 --------> Display Warning & Update Alert
         |
         +---> Status: -Perlu Tindakan- 🔴 --> Display Exception Reason & Form Action
                                                      |
                                     +----------------+----------------+
                                     |                                 |
                          [User Update Patokan Alamat]      [User Escalated to CS]
                                     |                                 |
                          [Data Pushed to Courier]          [CS Ticket Created w/ Payload]
```

---

## 7. METRIK KEBERHASILAN (KPI) & SIMULASI DAMPAK BISNIS

### 7.1 Matriks Indikator Kinerja Utama (KPI)
| Kategori Metrik | Nama Metrik | Target MVP |
| :--- | :--- | :--- |
| **Metrik Utama (North Star)** | % Paket Berisiko terselesaikan sebelum SLA Gagal | **> 40%** dari total paket -Berisiko- |
| **Metrik Hasil Bisnis** | Penurunan Kontak WISMO per 1.000 Paket | Turun **15% - 20%** |
| | First-Attempt Delivery Success Rate | Naik **+3.5%** |
| | Average Exception Resolution Time | Turun dari 24 jam ke **< 6 jam** |
| **Metrik Penggunaan Fitur**| Self-Service Resolution Completion Rate | **> 30%** pengguna terkena exception |
| | CS Ticket Escalation Containment | Turun **25%** (selesai di form mandiri) |
| **Guardrail Metrics** | False Positive Alert Rate | **< 5%** |
| | Courier Added Workload per Package | **0 menit** tambahan input manual |
| | PII Data Leak / Unauthorized AWB Access | **0 Kasus (Strict Zero)** |

### 7.2 Simulasi Penghematan Biaya Bisnis (*Cost Avoidance Model*)
* **Asumsi Pilot Scaling**: 100.000 paket / bulan.
* **Tingkat Kontak WISMO Awal**: 30 kontak per 1.000 paket = 3.000 kontak CS / bulan.
* **Target Penurunan Kontak (MVP)**: 20% penurunan = 600 kontak terhindarkan / bulan.
* **Biaya Operasional CS per Kontak**: Rp8.000,- (gaji agen, infrastruktur voip/chat, ticketing).
* **Rumus Penghematan**: 
  $$	ext{Cost Avoidance} = 	ext{Volume Paket} 	imes \left(rac{	ext{WISMO Rate}}{1000}ight) 	imes 	ext{\% Reduksi} 	imes 	ext{Biaya per Kontak}$$
* **Hasil Simulasi**: 
  $$	ext{Cost Avoidance} = 100.000 	imes 0.03 	imes 0.20 	imes 	ext{Rp}8.000 = \mathbf{	ext{Rp}4.800.000,- 	ext{/ bulan}}$$
*(Untuk skala nasional 10 juta paket/bulan, potensi penghematan mencapai **Rp480.000.000,- / bulan**).*

---

## 8. ROADMAP PELUNCURAN 8 MINGGU

```
Minggu 1-2: DISCOVERY & BASELINE
- Definisi event contract, journey mapping, penetapan baseline SLA & WISMO rate.

Minggu 3: PROTOTYPE & CONTRACT
- User prototype testing, penyusunan OpenAPI contract, taksonomi exception.

Minggu 4-6: BUILD MVP
- Pengembangan Frontend Next.js Widget, Rules Engine, PostgreSQL/Redis Data Layer.

Minggu 7: PILOT LAUNCH
- Uji coba di 1 Hub (Staging Pontianak), 1 Kelas Layanan (Regular), Cohort Terbatas.

Minggu 8: EVALUATE & DECISION GATE
- Analisis dampak KPI & Guardrails untuk keputusan: SCALE / ITERATE / STOP.
```

---

## 9. MATRIKS RISIKO & MITIGASI

| ID | Deskripsi Risiko | Probabilitas / Dampak | Strategi Mitigasi Terencana |
| :--- | :--- | :--- | :--- |
| **R-01** | Disiplin *scan event* di hub/kurir terlambat/terlewat. | Tinggi / Tinggi | Implementasi *Data Quality Score* per hub dan status *fallback default*. |
| **R-02** | *Alert fatigue* (terlalu banyak notifikasi ke pengguna). | Sedang / Tinggi | Pengaturan *threshold* bertingkat, notifikasi *opt-in*, & jam tenang (*quiet hours*). |
| **R-03** | Informasi ETA menyesatkan pemicu komplain baru. | Sedang / Tinggi | Gunakan *Confidence Band* (-Sesuai Jadwal-) daripada ETA jam presisi palsu. |
| **R-04** | Kebocoran data PII (Alamat/No HP) via pencarian AWB acak. | Sedang / Tinggi | Penerapan *Rate Limiting* API, *PII Masking*, & otentikasi via OTP / Link Token. |
| **R-05** | Integrasi sistem *legacy* lambat & rawan *downtime*. | Tinggi / Sedang | Gunakan pola *Adapter Layer* decoupler & *read-only database replica*. |
| **R-06** | Penambahan beban kerja kurir akibat instruksi baru. | Sedang / Tinggi | Format instruksi dibuat ringkas & otomatis ter-push ke app genggam kurir. |
| **R-07** | *Scope Creep* fitur melebar dari batas MVP. | Tinggi / Sedang | Kepatuhan ketat pada dokumen *Out-of-Scope* & kriteria *Definition of Done*. |

---

## 10. MODEL TATA KELOLA & KOLABORASI ANTAR-FUNGSI

```
+------------------+---------------------------------------------------------------+
| Peran Tim        | Tanggung Jawab Utama dalam Proyek MVP                         |
+------------------+---------------------------------------------------------------+
| Product Manager  | Ownership problem framing, prioritas fitur, dan metrik KPI.   |
| Operations / Hub | Penguasaan taksonomi exception, validasi SOP & ketersediaan. |
| Courier Rep.     | Validasi kepraktisan instruksi alamat di aplikasi kurir.       |
| Customer Service | Penyusunan template respon, alur tiket, dan SLA penanganan.   |
| Engineering/Data | Pembangunan Event Contract, API, Rules Engine, & Observability|
| Security / Legal | Penjaminan kepatuhan PII, enkripsi data, & persetujuan user.   |
| Commercial       | Perekrutan seller pilot, penampungan feedback UMKM.           |
+------------------+---------------------------------------------------------------+
```

---
*Dokumen PRD ini bersifat rahasia dan dikembangkan khusus untuk proyek integrasi Anteraja Tracking Widget.*


---

## 5. RINGKASAN PRD 8 BAGIAN UTAMA & MATRIKS SKALA

Bagian ini ditambahkan untuk memenuhi standar ringkasan 8 parameter dan evaluasi skala teknis 6 pertanyaan utama.

### A. 8 Komponen Utama PRD
1. **Masalah (Apa yang bermasalah sekarang?)**
   Terdapat keluhan pelacakan (volume WISMO tinggi) dan paket tertunda akibat kendala operasional lapangan. Berdasarkan data riset UGM 2025 (6.451 ulasan), komplain terbesar berada di kategori *Customer Service & Technical Issues*.
2. **Pengguna (Siapa yang pakai, ada berapa?)**
   - Penerima Paket: ~500.000 pelanggan/hari.
   - Seller/UMKM: ~15.000 penjual/hari.
   - CS Anteraja: ~300 staf aktif.
   - Kurir/Satria: ~2.500 kurir aktif/hari.
3. **Tujuan (Berhasil itu kalau apa?)**
   - Menurunkan volume tiket WISMO sebesar 30%.
   - Meningkatkan rasio *First-attempt delivery success* menjadi 95%.
   - Menyelesaikan *exception resolution time* dalam waktu < 2 jam sejak form disubmit.
4. **Lingkup (Apa yang dibuat, apa yang nggak?)**
   - **Termasuk**: Widget Tracking, Timeline translasi bahasa konsumen, SLA Risk Indicator, Form Resolusi Mandiri Alamat, dan integrasi tiket CS otomatis.
   - **Tidak Termasuk**: Optimasi rute dinamis, prediksi ETA berbasis AI, Chatbot Generative AI.
5. **Batasan (Apa yang wajib dipakai atau dipatuhi?)**
   - Wajib menggunakan arsitektur *Adapter Layer* terisolasi.
   - Menyembunyikan (masking) identitas PII sesuai regulasi UU PDP.
   - Dapat di-embed (iframe/script) di merchant platform.
6. **Skala (Seberapa besar dan seberapa penting?)**
   - *(Lihat rincian lengkap pada Tabel Matriks Skala di poin B)*
7. **Daftar fitur (Fitur apa saja, mana duluan?)**
   - Fitur 1: AWB Lookup & Unified Timeline (P1)
   - Fitur 2: SLA Risk Indicator (P1)
   - Fitur 3: Form Resolusi Alamat (P2)
   - Fitur 4: Eskalasi Konteks CS (P2)
8. **Keputusan terbuka (Apa yang belum diputuskan?)**
   - Apakah *update* patokan alamat butuh persetujuan admin hub atau langsung masuk ke aplikasi kurir? (PIC: VP Operations).
   - Penentuan *rate-limit* public API? (PIC: Head of Engineering).

### B. Matriks Skala & Kinerja Eksekusi
*Sesuai dengan 6 indikator evaluasi skala produk teknis.*

| Pertanyaan | Jawaban Skala (Anteraja Tracking) |
| :--- | :--- |
| **Berapa pengguna, kapan paling ramai?** | ~517.800 pengguna harian gabungan. Paling ramai saat puncak festival belanja Harbolnas (tanggal kembar 10.10, 11.11, 12.12). |
| **Berapa data per tahun, disimpan berapa lama?** | ~180 juta pergerakan resi per tahun. Disimpan di Redis Cache 3 bulan, lalu masuk ke PostgreSQL *Cold Storage* selama 5 tahun. |
| **Nunggu berapa lama masih wajar?** | Rendering *timeline* logistik dan data *tracking* maksimal < 200 milidetik (p95). |
| **File segede apa?** | Sangat kecil. Tidak ada unggahan file media, hanya menampung *payload* teks JSON (koordinat lat/long dan catatan patokan < 500 KB). |
| **Pakai sistem lain apa? Kalau mati?** | Tergantung pada *Core Logistics System Anteraja* dan API Notifikasi (WA/FCM). Jika sistem mati, fallback menggunakan portal CS statis manual. |
| **Kalau aplikasi mati 1 jam, separah apa?** | Mengganggu operasional CS karena tiket WISMO akan menumpuk. Harus ada notifikasi pemeliharaan sistem, usahakan tidak *downtime* saat musim Harbolnas. |
