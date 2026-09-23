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
SOURCE_SCREENSHOT = ROOT / "docs" / "quality" / "evidence" / "04-tracking-valid.webp"
SCREENSHOT = SUBMISSION / "fr-trk-05-action-required.webp"
PDF = OUTPUT / "day7-prototype-report.pdf"
ZIP = DAY7 / "Anteraja-Day-7-Prototype-Evan-William.zip"
BRANCH_URL = "https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/7-prototype"

INK = HexColor("#211C1F")
MUTED = HexColor("#6E676A")
LINE = HexColor("#DDD7D9")
PAPER = HexColor("#FAF8F7")
MAGENTA = HexColor("#EC008C")


def text(c: canvas.Canvas, value: str, x: float, y: float, size: float, bold: bool = False, color=INK) -> None:
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
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
    text(c, title_value, 44, h - 88, 23, True, INK)
    c.setStrokeColor(LINE)
    c.line(44, h - 108, w - 44, h - 108)
    text(c, f"{page:02d}", w - 61, 28, 8, True, MUTED)


def bullet(c: canvas.Canvas, x: float, y: float, title_value: str, body: str, width: float = 470) -> float:
    c.setFillColor(MAGENTA)
    c.circle(x + 3, y + 4, 2.7, fill=1, stroke=0)
    text(c, title_value, x + 16, y, 11, True, INK)
    return paragraph(c, body, x + 16, y - 20, width - 16, 9.5, 14, MUTED) - 16


def build_pdf() -> None:
    c = canvas.Canvas(str(PDF), pagesize=A4, pageCompression=1)
    w, h = A4

    # Cover
    c.setFillColor(PAPER); c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(MAGENTA); c.rect(0, 0, 12, h, fill=1, stroke=0)
    text(c, "DAY 7 - PROTOTYPE", 54, h - 85, 11, True, MAGENTA)
    text(c, "Anteraja Tracking", 54, h - 145, 32, True, INK)
    text(c, "& Operations", 54, h - 184, 32, True, INK)
    paragraph(c, "Implementasi UI menjadi prototype web yang saling terhubung, semantik, responsif, dan siap dikembangkan dengan interaksi JavaScript.", 54, h - 228, 420, 14, 21, MUTED)
    c.setFillColor(INK); c.roundRect(54, 150, w - 108, 200, 15, fill=1, stroke=0)
    text(c, "9", 84, 282, 42, True, white); text(c, "rute utama", 86, 258, 11, False, HexColor("#D7D0D3"))
    text(c, "HTML5", 230, 282, 28, True, white); text(c, "semantic structure", 232, 258, 11, False, HexColor("#D7D0D3"))
    text(c, "JSON-LD", 405, 282, 26, True, white); text(c, "Schema.org", 407, 258, 11, False, HexColor("#D7D0D3"))
    text(c, "Evan William", 54, 92, 12, True, INK)
    text(c, "Branch 7-prototype", 54, 70, 10, False, MUTED)
    c.showPage()

    # Criteria and branch
    base(c, "01 - Pengumpulan", "Branch dan kriteria tugas", 2)
    text(c, "Branch", 50, h - 160, 10, True, MAGENTA)
    text(c, "7-prototype", 50, h - 202, 29, True, INK)
    text(c, BRANCH_URL, 50, h - 232, 9.5, False, INK)
    c.linkURL(BRANCH_URL, (50, h - 242, w - 50, h - 222), relative=0)
    y = h - 292
    checks = [
        ("Halaman mengikuti PRD dan FRD", "Tracking publik, autentikasi, seller operations, arus dana, rekonsiliasi, dan kategori tersedia sebagai rute nyata."),
        ("UI dan UX diterapkan", "Hierarchy, status, error, loading, empty state, keyboard focus, privasi, dan tindakan utama mengikuti kebutuhan pengguna."),
        ("Halaman saling terhubung", "Navigasi publik, navigasi seller, link detail, serta anchor Tangani sekarang membentuk alur lengkap."),
        ("Lima commit modular", "Structured data, selector, dokumentasi, verifier, dan paket pengumpulan dipisahkan agar mudah ditinjau."),
    ]
    for title_value, body in checks:
        y = bullet(c, 50, y, title_value, body)
    c.showPage()

    # Route map
    base(c, "02 - Struktur", "Sembilan halaman mengikuti kebutuhan produk", 3)
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
        c.setStrokeColor(LINE); c.line(50, y - 10, w - 50, y - 10)
        text(c, route, x[0], y, 10, True, INK)
        text(c, frd, x[1], y, 9.5, False, MUTED)
        text(c, purpose, x[2], y, 9.5, False, INK)
        y -= 56
    c.showPage()

    # Screenshot
    base(c, "03 - Bukti FR", "TRK-05 - Risiko dan tindakan pengiriman", 4)
    with Image.open(SCREENSHOT) as image:
        iw, ih = image.size
    max_w, max_h = w - 90, h - 200
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(ImageReader(str(SCREENSHOT)), (w - dw) / 2, 62, width=dw, height=dh, preserveAspectRatio=True, mask="auto")
    paragraph(c, "ANT-100015 menampilkan status Perlu tindakan, alasan kendala, ETA, posisi terakhir, timeline, serta form penyelesaian dalam satu alur.", 50, 42, w - 100, 8.5, 12, MUTED)
    c.showPage()

    # Technical proof
    base(c, "04 - Implementasi", "Bukti semantic HTML, JSON-LD, dan responsivitas", 5)
    y = h - 158
    y = bullet(c, 50, y, "Semantic HTML", "Setiap halaman utama memakai main. Konten memakai section, article, header, nav, aside, form, table, caption, heading, list, dan description list sesuai makna.")
    y = bullet(c, 50, y, "JSON-LD Schema.org", "Halaman /lacak memuat WebApplication dengan applicationCategory, browserRequirements, inLanguage, isAccessibleForFree, dan featureList.")
    y = bullet(c, 50, y, "Responsive", "Layout mobile-first dimulai dari 320 px. Grid berkembang pada sm, md, lg, xl; tabel dapat digulir; input mobile minimal 16 px.")
    y = bullet(c, 50, y, "Selector siap untuk latihan berikutnya", "Form tracking, field resi, kode akses, autentikasi, filter, pencarian, ekspor, file CSV, dan tombol simpan memiliki ID atau class js-* yang stabil.")
    y = bullet(c, 50, y, "Commit modular", "1. structured data; 2. selector; 3. dokumentasi; 4. verifier; 5. paket pengumpulan.")
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
    if not SCREENSHOT.exists() or SOURCE_SCREENSHOT.read_bytes() != SCREENSHOT.read_bytes():
        shutil.copy2(SOURCE_SCREENSHOT, SCREENSHOT)
    build_pdf()
    build_zip()
    print(f"SCREENSHOT: {SCREENSHOT}")
    print(f"PDF: {PDF}")
    print(f"ZIP: {ZIP}")


if __name__ == "__main__":
    main()
