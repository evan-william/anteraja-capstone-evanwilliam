from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
DAY7 = ROOT.parent
SUBMISSION = ROOT / "docs" / "submissions" / "day-7"
OUTPUT = ROOT / "output" / "pdf"
TMP = ROOT / "tmp" / "pdfs" / "day7"
EVIDENCE = ROOT / "docs" / "quality" / "evidence"
DESIGN = ROOT / "docs" / "design" / "screens"
SOURCE_SCREENSHOT = EVIDENCE / "04-tracking-valid.webp"
SCREENSHOT = SUBMISSION / "fr-trk-05-action-required.webp"
PDF = OUTPUT / "day7-prototype-report.pdf"
ZIP = DAY7 / "Anteraja-Day-7-Prototype-Evan-William.zip"
BRANCH_URL = "https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/7-prototype"

INK = HexColor("#211C1F")
MUTED = HexColor("#6E676A")
LINE = HexColor("#DDD7D9")
PAPER = HexColor("#FAF8F7")
MAGENTA = HexColor("#EC008C")


RUNTIME_SCREENS = [
    ("01-auth-desktop.webp", "Login seller - desktop", "/masuk | AUTH-01", "Form autentikasi dua kolom dengan carousel operasional Anteraja."),
    ("02-register-desktop.webp", "Registrasi akun - desktop", "/daftar | AUTH-01", "Form pendaftaran akun dengan validasi nama, email, dan password."),
    ("03-tracking-invalid.webp", "Pencarian resi - kode tidak valid", "/lacak | TRK-01, TRK-02", "State error menjaga privasi saat pasangan resi dan kode akses tidak cocok."),
    ("04-tracking-valid.webp", "Detail tracking dan tindakan", "/lacak/[awb] | TRK-03 - TRK-12", "Status, ETA, timeline, ringkasan, tindakan, notifikasi, dan akses laporan CS."),
    ("05-tracking-loading.webp", "Tracking - loading state", "/lacak/[awb] | TRK-02", "Skeleton mengikuti struktur hasil agar perpindahan state tidak menggeser layout."),
    ("06-dashboard-desktop.webp", "Operasi pengiriman - desktop", "/pengiriman | OPS-01 - OPS-06", "Metrik, pencarian, filter risiko, tabel pengiriman, dan ekspor."),
    ("07-dashboard-empty.webp", "Operasi pengiriman - empty state", "/pengiriman | OPS-06", "Kondisi akun tanpa data tetap menjelaskan langkah pemulihan dan akun demo."),
    ("08-dashboard-long-content.webp", "Operasi pengiriman - data panjang", "/pengiriman | OPS-01 - OPS-06", "Tabel diuji dengan nama, kota, dan status panjang tanpa merusak hierarchy."),
    ("09-finance-desktop.webp", "Arus dana dan transaksi", "/transaksi | FIN-01", "Ringkasan dana dan daftar transaksi membentuk jejak shipment, COD, dan settlement."),
    ("10-reconciliation-desktop.webp", "Rekonsiliasi mutasi bank", "/import | FIN-03 - FIN-10", "Upload CSV, riwayat impor, dan status rekonsiliasi berada dalam satu alur."),
    ("11-auth-mobile.webp", "Login seller - mobile", "/masuk | AUTH-01", "Form tetap menjadi fokus utama pada viewport sempit."),
    ("12-tracking-mobile.webp", "Detail tracking - mobile", "/lacak/[awb] | TRK-03 - TRK-12", "Informasi posisi, ETA, timeline, dan tindakan tersusun vertikal tanpa kehilangan konteks."),
    ("13-dashboard-mobile.webp", "Operasi pengiriman - mobile", "/pengiriman | OPS-01 - OPS-06", "Navigasi, metrik, filter, dan daftar tetap dapat digunakan dari layar kecil."),
    ("14-dashboard-tablet.webp", "Operasi pengiriman - tablet", "/pengiriman | OPS-01 - OPS-06", "Grid dan tabel menyesuaikan viewport menengah."),
    ("15-auth-reduced-motion.webp", "Autentikasi - reduced motion", "/masuk | AUTH-01", "Carousel menghormati preferensi pengurangan motion tanpa menghilangkan konten."),
    ("16-tracking-action-priority.webp", "Prioritas tindakan pengiriman", "/lacak/[awb] | TRK-05", "Peringatan ditempatkan sebelum ringkasan dan menyediakan tombol Tangani sekarang."),
    ("17-support-report.webp", "Laporan ke customer service", "/lacak/[awb] | TRK-10", "Textarea lebar mendukung laporan rinci dan data paket terlampir otomatis."),
    ("18-tracking-action-mobile.webp", "Prioritas tindakan - mobile", "/lacak/[awb] | TRK-05", "Peringatan dan CTA tetap jelas tanpa bergantung pada warna saja."),
    ("19-support-report-mobile.webp", "Laporan CS - mobile", "/lacak/[awb] | TRK-10", "Form laporan tetap nyaman ditulis dan dikirim pada viewport sempit."),
]

DESIGN_SCREENS = [
    ("01-dashboard-settlement.webp", "Dashboard settlement", "/transaksi | FIN-01", "Ringkasan settlement dan daftar transaksi untuk pemeriksaan arus dana."),
    ("02-upload-mutasi.webp", "Upload mutasi settlement", "/import | FIN-03", "Dropzone CSV dan panduan format sebelum proses rekonsiliasi."),
    ("03-preview-rekonsiliasi.webp", "Preview hasil rekonsiliasi", "/import | FIN-04 - FIN-08", "Perbandingan data sumber, hasil pencocokan, dan status sebelum disimpan."),
    ("04-riwayat-pembatalan.webp", "Riwayat impor dan pembatalan", "/import | FIN-09 - FIN-10", "Riwayat rekonsiliasi dan konsekuensi pembatalan ditampilkan secara eksplisit."),
    ("05-rincian-shipment.webp", "Rincian shipment dan settlement", "/pengiriman/[awb] | OPS-04", "Detail pengiriman menghubungkan resi, biaya, COD, dan status settlement."),
    ("06-preview-mobile.webp", "Preview rekonsiliasi - mobile", "/import | FIN-04 - FIN-08", "Alur pemeriksaan tetap dapat dilakukan dari layar kecil."),
]


def text(c: canvas.Canvas, value: str, x: float, y: float, size: float, bold: bool = False, color=INK) -> None:
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.setFillColor(color)
    c.drawString(x, y, value)


def fitted_text(c: canvas.Canvas, value: str, x: float, y: float, max_width: float, size: float, color=INK) -> None:
    font = "Helvetica-Bold"
    while size > 14 and stringWidth(value, font, size) > max_width:
        size -= 1
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, value)


def paragraph(c: canvas.Canvas, value: str, x: float, y: float, width: float, size: float = 10.5, leading: float = 15, color=MUTED) -> float:
    words = value.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, "Helvetica", size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    c.setFont("Helvetica", size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def base(c: canvas.Canvas, kicker: str, title_value: str, page: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    text(c, kicker.upper(), 44, h - 54, 9, True, MAGENTA)
    fitted_text(c, title_value, 44, h - 88, w - 88, 23)
    c.setStrokeColor(LINE)
    c.line(44, h - 108, w - 44, h - 108)
    text(c, f"{page:02d}", w - 61, 28, 8, True, MUTED)


def bullet(c: canvas.Canvas, x: float, y: float, title_value: str, body: str, width: float = 470) -> float:
    c.setFillColor(MAGENTA)
    c.circle(x + 3, y + 4, 2.7, fill=1, stroke=0)
    text(c, title_value, x + 16, y, 11, True, INK)
    return paragraph(c, body, x + 16, y - 20, width - 16, 9.5, 14, MUTED) - 16


def compressed_image(source: Path) -> Path:
    target = TMP / f"{source.stem}.jpg"
    with Image.open(source) as image:
        converted = image.convert("RGB")
        converted.thumbnail((1200, 1800), Image.Resampling.LANCZOS)
        converted.save(target, "JPEG", quality=52, optimize=True, progressive=True)
    return target


def screenshot_page(c: canvas.Canvas, source: Path, title_value: str, context: str, description: str, page: int, group: str) -> None:
    w, h = A4
    base(c, group, title_value, page)
    text(c, context, 44, h - 136, 9.5, True, MAGENTA)
    paragraph(c, description, 44, h - 158, w - 88, 9.3, 13, MUTED)
    prepared = compressed_image(source)
    with Image.open(prepared) as image:
        iw, ih = image.size
    max_w, max_h = w - 88, h - 250
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    x = (w - dw) / 2
    y = 52 + (max_h - dh) / 2
    c.setFillColor(white)
    c.roundRect(x - 4, y - 4, dw + 8, dh + 8, 5, fill=1, stroke=0)
    c.drawImage(ImageReader(str(prepared)), x, y, width=dw, height=dh, preserveAspectRatio=True, mask="auto")
    c.showPage()


def section_page(c: canvas.Canvas, number: str, title_value: str, body: str, count: str, page: int) -> None:
    w, h = A4
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(MAGENTA)
    c.rect(0, 0, 12, h, fill=1, stroke=0)
    text(c, number, 54, h - 90, 11, True, MAGENTA)
    fitted_text(c, title_value, 54, h - 150, w - 108, 30)
    paragraph(c, body, 54, h - 194, w - 108, 13, 20, MUTED)
    c.setFillColor(INK)
    c.roundRect(54, 180, w - 108, 170, 12, fill=1, stroke=0)
    text(c, count, 82, 265, 46, True, white)
    text(c, "screenshot terdokumentasi", 84, 235, 12, False, HexColor("#D7D0D3"))
    text(c, f"{page:02d}", w - 61, 28, 8, True, MUTED)
    c.showPage()


def build_pdf() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(PDF), pagesize=A4, pageCompression=1)
    c.setTitle("Day 7 Prototype - Anteraja Tracking & Operations")
    c.setAuthor("Evan William")
    w, h = A4
    page = 1

    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(MAGENTA)
    c.rect(0, 0, 12, h, fill=1, stroke=0)
    text(c, "DAY 7 - PROTOTYPE", 54, h - 85, 11, True, MAGENTA)
    text(c, "Anteraja Tracking", 54, h - 145, 32, True, INK)
    text(c, "& Operations", 54, h - 184, 32, True, INK)
    paragraph(c, "Implementasi UI menjadi prototype web yang saling terhubung, semantik, responsif, dan siap dikembangkan dengan interaksi JavaScript.", 54, h - 228, 420, 14, 21, MUTED)
    c.setFillColor(INK)
    c.roundRect(54, 150, w - 108, 200, 15, fill=1, stroke=0)
    text(c, "9", 84, 282, 42, True, white)
    text(c, "rute utama", 86, 258, 11, False, HexColor("#D7D0D3"))
    text(c, "25", 230, 282, 38, True, white)
    text(c, "tampilan UI", 232, 258, 11, False, HexColor("#D7D0D3"))
    text(c, "JSON-LD", 405, 282, 26, True, white)
    text(c, "Schema.org", 407, 258, 11, False, HexColor("#D7D0D3"))
    text(c, "Evan William", 54, 92, 12, True, INK)
    text(c, "Branch 7-prototype", 54, 70, 10, False, MUTED)
    c.showPage()
    page += 1

    base(c, "01 - Pengumpulan", "Branch dan kriteria tugas", page)
    text(c, "Branch", 50, h - 160, 10, True, MAGENTA)
    text(c, "7-prototype", 50, h - 202, 29, True, INK)
    text(c, BRANCH_URL, 50, h - 232, 9.5, False, INK)
    c.linkURL(BRANCH_URL, (50, h - 242, w - 50, h - 222), relative=0)
    y = h - 292
    checks = [
        ("Halaman mengikuti PRD dan FRD", "Tracking publik, autentikasi, seller operations, arus dana, rekonsiliasi, dan kategori tersedia sebagai rute nyata."),
        ("UI dan UX diterapkan", "Hierarchy, status, error, loading, empty state, keyboard focus, privasi, dan tindakan utama mengikuti kebutuhan pengguna."),
        ("Halaman saling terhubung", "Navigasi publik, navigasi seller, link detail, serta anchor Tangani sekarang membentuk alur lengkap."),
        ("Enam commit modular", "Structured data, selector, dokumentasi, verifier, paket pengumpulan, dan finalisasi dipisahkan agar mudah ditinjau."),
    ]
    for title_value, body in checks:
        y = bullet(c, 50, y, title_value, body)
    c.showPage()
    page += 1

    base(c, "02 - Struktur", "Sembilan halaman mengikuti kebutuhan produk", page)
    rows = [
        ("/lacak", "TRK-01 - TRK-02", "Pencarian resi dan kode akses"),
        ("/lacak/[awb]", "TRK-03 - TRK-12", "Ringkasan, ETA, timeline, tindakan, CS"),
        ("/masuk", "AUTH-01", "Autentikasi seller"),
        ("/daftar", "AUTH-01", "Pendaftaran akun"),
        ("/pengiriman", "OPS-01 - OPS-06", "Control tower, filter, cari, ekspor"),
        ("/pengiriman/[awb]", "OPS-04", "Detail operasional shipment"),
        ("/transaksi", "FIN-01", "Arus dana"),
        ("/import", "FIN-03 - FIN-10", "Rekonsiliasi mutasi bank"),
        ("/kategori", "FIN-02", "Kategori dan klasifikasi"),
    ]
    x = [50, 208, 335]
    text(c, "RUTE", x[0], h - 150, 9, True, MAGENTA)
    text(c, "FRD", x[1], h - 150, 9, True, MAGENTA)
    text(c, "FUNGSI", x[2], h - 150, 9, True, MAGENTA)
    y = h - 182
    for route, frd, purpose in rows:
        c.setStrokeColor(LINE)
        c.line(50, y - 10, w - 50, y - 10)
        text(c, route, x[0], y, 10, True, INK)
        text(c, frd, x[1], y, 9.5, False, MUTED)
        text(c, purpose, x[2], y, 9.5, False, INK)
        y -= 56
    c.showPage()
    page += 1

    section_page(c, "03 - BUKTI IMPLEMENTASI", "Seluruh state UI utama", "Bagian ini memuat hasil render autentikasi, tracking publik, seller operations, finance, dan rekonsiliasi pada desktop, tablet, dan mobile.", str(len(RUNTIME_SCREENS)), page)
    page += 1
    for filename, title_value, context, description in RUNTIME_SCREENS:
        screenshot_page(c, EVIDENCE / filename, title_value, context, description, page, "03 - Bukti implementasi")
        page += 1

    section_page(c, "04 - DETAIL ANTARMUKA", "Layar pendukung dan detail alur", "Bagian ini melengkapi bukti runtime dengan layar settlement, upload, preview rekonsiliasi, riwayat pembatalan, detail shipment, dan tampilan mobile.", str(len(DESIGN_SCREENS)), page)
    page += 1
    for filename, title_value, context, description in DESIGN_SCREENS:
        screenshot_page(c, DESIGN / filename, title_value, context, description, page, "04 - Detail antarmuka")
        page += 1

    base(c, "05 - Implementasi", "Bukti teknis prototype", page)
    y = h - 158
    y = bullet(c, 50, y, "Semantic HTML", "Setiap halaman utama memakai main. Konten memakai section, article, header, nav, aside, form, table, caption, heading, list, dan description list sesuai makna.")
    y = bullet(c, 50, y, "JSON-LD Schema.org", "Halaman /lacak memuat WebApplication dengan applicationCategory, browserRequirements, inLanguage, isAccessibleForFree, dan featureList.")
    y = bullet(c, 50, y, "Responsive", "Layout mobile-first dimulai dari 320 px. Grid berkembang pada sm, md, lg, xl; tabel dapat digulir; input mobile minimal 16 px.")
    y = bullet(c, 50, y, "Selector siap untuk latihan berikutnya", "Form tracking, field resi, kode akses, autentikasi, filter, pencarian, ekspor, file CSV, dan tombol simpan memiliki ID atau class js-* yang stabil.")
    y = bullet(c, 50, y, "Commit modular", "Enam commit memisahkan structured data, selector, dokumentasi, verifier, paket pengumpulan, dan finalisasi.")
    text(c, "Dokumentasi lengkap: docs/prototype/", 50, 74, 10, True, INK)
    text(c, "Verifier: npm run verify:prototype", 50, 54, 9.5, False, MUTED)
    c.showPage()
    c.save()


def build_zip() -> None:
    files = [
        PDF,
        SCREENSHOT,
        SUBMISSION / "README.md",
        ROOT / "docs" / "prototype" / "README.md",
        ROOT / "docs" / "prototype" / "PAGE_FRD_MAPPING.md",
        ROOT / "docs" / "prototype" / "SELECTOR_REFERENCE.md",
        ROOT / "lib" / "structured-data.ts",
        ROOT / "tools" / "verify-prototype.mjs",
    ]
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr("BRANCH_LINK.txt", BRANCH_URL + "\n")
        for source in files:
            if source == PDF:
                target = Path("LMS") / source.name
            elif source == SCREENSHOT:
                target = Path("evidence") / source.name
            else:
                target = source.relative_to(ROOT)
            archive.write(source, target.as_posix())


def main() -> None:
    SUBMISSION.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir(parents=True, exist_ok=True)
    if not SCREENSHOT.exists() or SOURCE_SCREENSHOT.read_bytes() != SCREENSHOT.read_bytes():
        shutil.copy2(SOURCE_SCREENSHOT, SCREENSHOT)
    build_pdf()
    build_zip()
    shutil.rmtree(TMP)
    print(f"SCREENSHOT: {SCREENSHOT}")
    print(f"PDF: {PDF}")
    print(f"ZIP: {ZIP}")


if __name__ == "__main__":
    main()
