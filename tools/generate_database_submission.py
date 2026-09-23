from __future__ import annotations

import shutil
import textwrap
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.lib.pagesizes import landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "database"
ERD_DIR = DB / "erd"
SCREEN_DIR = ROOT / "output" / "screenshots"
PDF_DIR = ROOT / "output" / "pdf"
DAY6_DIR = ROOT.parent
PDF_PATH = PDF_DIR / "day6-database-report.pdf"
ZIP_PATH = DAY6_DIR / "Anteraja-Database-Day-6-Evan-William.zip"
BRANCH_URL = "https://github.com/evan-william/anteraja-capstone-evanwilliam/tree/6-db"

FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
FONT_MONO = Path("C:/Windows/Fonts/consola.ttf")
FONT_MONO_BOLD = Path("C:/Windows/Fonts/consolab.ttf")

INK = "#1D1A1B"
MUTED = "#696466"
PAPER = "#F8F6F4"
LINE = "#D7D1CE"
MAGENTA = "#EC008C"
SOFT = "#EEEAE7"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def ensure_dirs() -> None:
    ERD_DIR.mkdir(parents=True, exist_ok=True)
    SCREEN_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)


def build_full_schema() -> None:
    migrations = sorted((ROOT / "supabase" / "migrations").glob("*.sql"))
    parts = [
        "-- ANTERAJA TRACKING & OPERATIONS - FULL POSTGRESQL SCHEMA\n",
        "-- Generated from supabase/migrations in timestamp order.\n",
        "-- Run once on an empty Supabase project. Do not run after migrations.\n\n",
    ]
    for migration in migrations:
        parts.extend(
            [
                "\n-- ============================================================================\n",
                f"-- SOURCE: supabase/migrations/{migration.name}\n",
                "-- ============================================================================\n\n",
                migration.read_text(encoding="utf-8").rstrip(),
                "\n",
            ]
        )
    (DB / "00_full_schema.sql").write_text("".join(parts), encoding="utf-8", newline="\n")


EXTRA_SAMPLE = r'''

-- ---------------------------------------------------------------------------
-- Contoh relasi tambahan untuk penilaian database
-- ---------------------------------------------------------------------------

begin;

insert into public.category_rules (id, user_id, category_id, keyword, type)
values (
  '55555555-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '22222222-0000-4000-8000-000000000007',
  'settlement cod',
  'income'
) on conflict (id) do update set keyword = excluded.keyword, updated_at = now();

insert into public.transactions (
  id, user_id, category_id, amount, description, transaction_date
) values (
  '66666666-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '22222222-0000-4000-8000-000000000007',
  600000,
  'Settlement COD contoh untuk rekonsiliasi',
  current_date - 1
) on conflict (id) do update set amount = excluded.amount, updated_at = now();

insert into public.bank_imports (
  id, user_id, file_name, bank, new_count, matched_count, error_count, status
) values (
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'mutasi-bank-demo.csv',
  'bank_a', 1, 1, 1, 'completed'
) on conflict (id) do update set updated_at = now();

insert into public.bank_import_rows (
  id, import_id, user_id, row_number, fingerprint, transaction_date,
  description, amount, type, status, category_id, created_transaction_id
) values (
  '88888888-0000-4000-8000-000000000001',
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  1, 'demo-new-row-001', current_date - 1,
  'Settlement COD contoh untuk rekonsiliasi', 600000, 'income', 'new',
  '22222222-0000-4000-8000-000000000007',
  '66666666-0000-4000-8000-000000000001'
) on conflict (id) do nothing;

insert into public.bank_import_rows (
  id, import_id, user_id, row_number, fingerprint, transaction_date,
  description, amount, type, status, matched_transaction_id, settlement_id
) values (
  '88888888-0000-4000-8000-000000000002',
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  2, 'demo-matched-row-002', current_date - 1,
  'Settlement COD contoh untuk rekonsiliasi', 600000, 'income', 'matched',
  '66666666-0000-4000-8000-000000000001',
  '44444444-0000-4000-8000-000000000001'
) on conflict (id) do nothing;

insert into public.bank_import_rows (
  id, import_id, user_id, row_number, fingerprint, status, error_message
) values (
  '88888888-0000-4000-8000-000000000003',
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  3, 'demo-error-row-003', 'error', 'Tanggal transaksi tidak valid'
) on conflict (id) do nothing;

insert into public.shipment_resolutions (
  id, user_id, shipment_id, resolution_type, payload, status, submitted_at
) values (
  '99999999-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000004',
  'reschedule', '{"date":"2026-09-25","note":"Penerima tersedia setelah pukul 13.00"}',
  'pending_sync', now() - interval '1 day'
) on conflict (id) do nothing;

insert into public.support_tickets (
  id, user_id, shipment_id, ticket_number, customer_note,
  context_snapshot, status, response_due_at
) values (
  'aaaaaaaa-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000002',
  'AJ-DEMO-001', 'Mohon periksa paket yang belum mendapat scan baru.',
  '{"tracking_number":"ANT-100084","risk_status":"at_risk","last_location":"Hub Bekasi"}',
  'open', now() + interval '2 hours'
) on conflict (id) do nothing;

insert into public.notification_preferences (
  id, user_id, shipment_id, whatsapp_enabled, email_enabled,
  push_enabled, meaningful_changes_only, destination_masked
) values (
  'bbbbbbbb-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000003',
  true, true, false, true, '081***678'
) on conflict (shipment_id) do update set
  whatsapp_enabled = excluded.whatsapp_enabled,
  email_enabled = excluded.email_enabled,
  updated_at = now();

insert into public.integration_outbox (
  id, user_id, shipment_id, destination, event_type, payload, status
) values (
  'cccccccc-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000002',
  'customer_service', 'support.ticket_created',
  '{"ticket_number":"AJ-DEMO-001","tracking_number":"ANT-100084"}', 'pending'
) on conflict (id) do nothing;

commit;
'''


def build_sample_data() -> None:
    seed = (ROOT / "supabase" / "seed.sql").read_text(encoding="utf-8").rstrip()
    (DB / "01_sample_data.sql").write_text(
        seed + EXTRA_SAMPLE,
        encoding="utf-8",
        newline="\n",
    )


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str, width: int = 2) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str = "#8C8588") -> None:
    sx, sy = start
    ex, ey = end
    midx = (sx + ex) // 2
    draw.line([(sx, sy), (midx, sy), (midx, ey), (ex, ey)], fill=color, width=3)
    draw.polygon([(ex, ey), (ex - 12, ey - 7), (ex - 12, ey + 7)], fill=color)


def build_erd() -> Path:
    w, h = 2600, 1760
    image = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(image)
    title = font(FONT_BOLD, 54)
    subtitle = font(FONT_REGULAR, 25)
    label = font(FONT_BOLD, 22)
    body = font(FONT_MONO, 18)
    small = font(FONT_REGULAR, 19)

    draw.text((90, 60), "ERD - Anteraja Tracking & Operations", font=title, fill=INK)
    draw.text((90, 130), "PostgreSQL / Supabase | 15 tabel publik | PK, FK, composite FK, RLS", font=subtitle, fill=MUTED)
    draw.line((90, 185, w - 90, 185), fill=LINE, width=3)

    boxes = {
        "users": (90, 300, 420, 500),
        "categories": (90, 830, 420, 1050),
        "transactions": (480, 830, 850, 1090),
        "category_rules": (90, 1130, 420, 1350),
        "bank_imports": (480, 1190, 850, 1410),
        "bank_import_rows": (930, 1190, 1370, 1535),
        "shipments": (560, 265, 990, 650),
        "shipment_events": (1110, 240, 1490, 480),
        "shipment_resolutions": (1110, 520, 1490, 760),
        "support_tickets": (1580, 240, 1960, 480),
        "notification_preferences": (1580, 520, 1960, 760),
        "integration_outbox": (2050, 380, 2430, 620),
        "tracking_rate_limits": (2050, 700, 2430, 900),
        "settlements": (1500, 1060, 1870, 1320),
        "settlement_items": (2050, 1040, 2430, 1320),
    }

    draw.text((90, 230), "IDENTITY", font=label, fill=MAGENTA)
    draw.text((560, 230), "LOGISTICS & TRACKING", font=label, fill=MAGENTA)
    draw.text((90, 785), "FINANCE & RECONCILIATION", font=label, fill=MAGENTA)

    rels = [
        ("users", "shipments"), ("users", "categories"),
        ("categories", "transactions"), ("categories", "category_rules"),
        ("users", "bank_imports"), ("bank_imports", "bank_import_rows"),
        ("transactions", "bank_import_rows"), ("shipments", "shipment_events"),
        ("shipments", "shipment_resolutions"), ("shipments", "support_tickets"),
        ("shipments", "notification_preferences"), ("shipments", "integration_outbox"),
        ("users", "settlements"), ("settlements", "settlement_items"),
        ("shipments", "settlement_items"), ("settlements", "bank_import_rows"),
    ]
    for left, right in rels:
        lb, rb = boxes[left], boxes[right]
        if rb[0] >= lb[2]:
            start, end = (lb[2], (lb[1] + lb[3]) // 2), (rb[0], (rb[1] + rb[3]) // 2)
        else:
            start, end = ((lb[0] + lb[2]) // 2, lb[3]), ((rb[0] + rb[2]) // 2, rb[1])
        arrow(draw, start, end)

    tables = {
        "users": ["PK id", "UQ email", "name", "created_at"],
        "shipments": ["PK id", "FK user_id", "UQ tracking_number", "delivery_status", "risk_status", "estimated_delivery_at", "access_code_hash"],
        "shipment_events": ["PK id", "FK shipment_id + user_id", "event_code", "status_label", "occurred_at"],
        "shipment_resolutions": ["PK id", "FK shipment_id + user_id", "resolution_type", "payload jsonb", "status"],
        "support_tickets": ["PK id", "FK shipment_id + user_id", "UQ ticket_number", "context_snapshot", "response_due_at"],
        "notification_preferences": ["PK id", "UQ shipment_id", "FK shipment_id + user_id", "whatsapp / email / push"],
        "integration_outbox": ["PK id", "FK shipment_id + user_id", "destination", "event_type", "status / attempts"],
        "tracking_rate_limits": ["PK client_key", "window_started_at", "request_count"],
        "categories": ["PK id", "FK user_id", "name", "type", "is_archived"],
        "transactions": ["PK id", "FK user_id", "FK category_id", "amount", "transaction_date", "is_deleted"],
        "category_rules": ["PK id", "FK user_id", "FK category_id", "keyword", "type"],
        "bank_imports": ["PK id", "FK user_id", "file_name / bank", "new / matched / error", "status"],
        "bank_import_rows": ["PK id", "FK import_id / user_id", "FK category_id", "FK matched / created txn", "FK settlement_id + user_id", "fingerprint", "status"],
        "settlements": ["PK id", "FK user_id", "UQ reference + user_id", "gross / fee / return", "net_amount generated", "status"],
        "settlement_items": ["PK id", "FK settlement_id + user_id", "FK shipment_id + user_id", "cod / fees / return", "net_amount generated"],
    }

    for name, rows in tables.items():
        x1, y1, x2, y2 = boxes[name]
        rounded(draw, (x1, y1, x2, y2), 14, "#FFFFFF", LINE, 3)
        draw.rectangle((x1, y1, x2, y1 + 54), fill=INK)
        draw.rectangle((x1, y1, x1 + 8, y1 + 54), fill=MAGENTA)
        draw.text((x1 + 22, y1 + 14), name, font=label, fill="#FFFFFF")
        y = y1 + 70
        for row in rows:
            draw.text((x1 + 22, y), row, font=body, fill=INK)
            y += 38

    draw.text((90, 1650), "Notasi: PK = primary key | FK = foreign key | UQ = unique | panah menuju tabel child", font=small, fill=MUTED)
    draw.text((90, 1685), "Composite FK menyertakan user_id untuk mencegah relasi lintas akun.", font=small, fill=MUTED)

    path = ERD_DIR / "anteraja-database-erd.webp"
    image.save(path, "WEBP", quality=92, method=6)
    return path


def code_screenshot(source: Path, target: Path, title: str, start: int, count: int) -> None:
    lines = source.read_text(encoding="utf-8").splitlines()[start : start + count]
    w, h = 1900, 1050
    image = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(image)
    title_font = font(FONT_BOLD, 36)
    meta_font = font(FONT_REGULAR, 22)
    code_font = font(FONT_MONO, 21)
    line_font = font(FONT_MONO, 19)
    draw.text((62, 45), title, font=title_font, fill=INK)
    draw.text((62, 95), str(source.relative_to(ROOT)).replace("\\", "/"), font=meta_font, fill=MUTED)
    draw.line((62, 140, w - 62, 140), fill=LINE, width=2)
    y = 175
    for idx, line in enumerate(lines, start=start + 1):
        draw.text((62, y), f"{idx:>4}", font=line_font, fill="#9A9295")
        safe = line.expandtabs(2)[:122]
        color = MAGENTA if safe.lstrip().startswith("--") else INK
        draw.text((135, y), safe, font=code_font, fill=color)
        y += 31
        if y > h - 45:
            break
    image.save(target, "WEBP", quality=90, method=6)


def doc_screenshot(source: Path, target: Path) -> None:
    lines = source.read_text(encoding="utf-8").splitlines()
    w, h = 1900, 1050
    image = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(image)
    h1 = font(FONT_BOLD, 42)
    h2 = font(FONT_BOLD, 29)
    body = font(FONT_REGULAR, 22)
    mono = font(FONT_MONO, 20)
    y = 48
    for line in lines[:48]:
        if not line.strip():
            y += 16
            continue
        if line.startswith("# "):
            draw.text((62, y), line[2:], font=h1, fill=INK)
            y += 62
        elif line.startswith("## "):
            draw.text((62, y), line[3:], font=h2, fill=INK)
            y += 46
        elif line.startswith("|"):
            draw.text((62, y), line[:145], font=mono, fill=MUTED)
            y += 30
        elif line.startswith("-"):
            draw.text((78, y), "- " + line[1:].strip(), font=body, fill=INK)
            y += 34
        else:
            for wrapped in textwrap.wrap(line, width=125) or [""]:
                draw.text((62, y), wrapped, font=body, fill=INK)
                y += 34
        if y > h - 50:
            break
    image.save(target, "WEBP", quality=90, method=6)


PAGE = landscape((13.333 * 72, 7.5 * 72))


def ptext(c: canvas.Canvas, text: str, x: float, y: float, size: float, bold: bool = False, color: Color = black) -> None:
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.setFillColor(color)
    c.drawString(x, y, text)


def paragraph(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: float = 12, leading: float = 18, color: Color = black) -> float:
    words = text.split()
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


def page_header(c: canvas.Canvas, kicker: str, title: str, page_no: int) -> None:
    width, height = PAGE
    c.setFillColor(HexColor(PAPER))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    ptext(c, kicker.upper(), 48, height - 52, 10, True, HexColor(MAGENTA))
    ptext(c, title, 48, height - 90, 26, True, HexColor(INK))
    c.setStrokeColor(HexColor(LINE))
    c.line(48, height - 112, width - 48, height - 112)
    ptext(c, f"{page_no:02d}", width - 68, 28, 9, True, HexColor(MUTED))


def draw_bullet(c: canvas.Canvas, x: float, y: float, title: str, body: str, width: float = 360) -> float:
    c.setFillColor(HexColor(MAGENTA))
    c.circle(x + 4, y + 4, 3, fill=1, stroke=0)
    ptext(c, title, x + 18, y, 13, True, HexColor(INK))
    return paragraph(c, body, x + 18, y - 22, width - 18, 10.5, 15, HexColor(MUTED)) - 18


def build_pdf(erd_path: Path, sql_shot: Path, seed_shot: Path, doc_shot: Path) -> None:
    c = canvas.Canvas(str(PDF_PATH), pagesize=PAGE, pageCompression=1)
    width, height = PAGE

    # 1 - cover
    c.setFillColor(HexColor(PAPER)); c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(HexColor(MAGENTA)); c.rect(0, 0, 16, height, fill=1, stroke=0)
    ptext(c, "DAY 6 - DATABASE DESIGN", 70, height - 88, 12, True, HexColor(MAGENTA))
    ptext(c, "Anteraja Tracking", 70, height - 155, 36, True, HexColor(INK))
    ptext(c, "& Operations", 70, height - 198, 36, True, HexColor(INK))
    paragraph(c, "PostgreSQL relational database untuk tracking paket, operasional seller, settlement, dan rekonsiliasi mutasi bank.", 70, height - 248, 430, 15, 22, HexColor(MUTED))
    ptext(c, "Evan William", 70, 104, 13, True, HexColor(INK))
    ptext(c, "Branch 6-db", 70, 82, 11, False, HexColor(MUTED))
    c.setFillColor(HexColor(INK)); c.roundRect(560, 70, 330, 390, 18, fill=1, stroke=0)
    ptext(c, "15", 608, 370, 62, True, white); ptext(c, "tabel publik", 610, 344, 12, False, HexColor("#D6CFD2"))
    ptext(c, "3NF", 608, 264, 42, True, white); ptext(c, "normalisasi inti", 610, 240, 12, False, HexColor("#D6CFD2"))
    ptext(c, "RLS", 608, 166, 42, True, white); ptext(c, "isolasi per akun", 610, 142, 12, False, HexColor("#D6CFD2"))
    c.showPage()

    # 2 - compliance
    page_header(c, "01 - Ruang lingkup", "Kebutuhan tugas sudah dipetakan ke artefak", 2)
    items = [
        ("Relational database", "PostgreSQL melalui Supabase dengan PK, FK, composite FK, constraint, index, trigger, RLS, dan RPC."),
        ("Analisis FRD dan UI", "FRD_DATA_MAPPING.md menautkan AUTH, TRK, OPS, FIN, dan komponen UI ke tabel atau function."),
        ("Tabel pendukung", "15 tabel publik mencakup tracking, tindakan penerima, tiket, notifikasi, seller, Finance, dan settlement."),
        ("ERD .webp", "Diagram final menampilkan domain, atribut kunci, dan relasi utama dalam satu kanvas."),
        ("Sample data", "Satu akun demo, lima shipment utama, timeline, settlement, impor bank, tiket, preferensi, dan outbox."),
        ("Dokumentasi", "Run guide, kamus data, normalisasi, ERD Mermaid, query verifikasi, dan smoke test tersedia."),
    ]
    y_positions = [372, 372, 372, 225, 225, 225]
    x_positions = [54, 358, 662, 54, 358, 662]
    for (title, body), x, y in zip(items, x_positions, y_positions):
        c.setFillColor(white); c.roundRect(x, y - 98, 270, 112, 10, fill=1, stroke=0)
        c.setStrokeColor(HexColor(LINE)); c.roundRect(x, y - 98, 270, 112, 10, fill=0, stroke=1)
        ptext(c, title, x + 18, y - 14, 12, True, HexColor(INK))
        paragraph(c, body, x + 18, y - 38, 232, 9.5, 13.5, HexColor(MUTED))
    c.showPage()

    # 3 - architecture
    page_header(c, "02 - Model data", "Satu sumber data untuk tiga area produk", 3)
    cols = [
        ("TRACKING", ["shipments", "shipment_events", "shipment_resolutions", "support_tickets", "notification_preferences"]),
        ("SELLER OPERATIONS", ["shipments", "risk_status", "search dan filter", "RLS per user", "integration_outbox"]),
        ("FINANCE", ["transactions", "categories dan rules", "bank imports dan rows", "settlements", "settlement_items"]),
    ]
    for i, (name, rows) in enumerate(cols):
        x = 54 + i * 305
        ptext(c, name, x, 382, 11, True, HexColor(MAGENTA))
        for j, row in enumerate(rows):
            yy = 342 - j * 48
            c.setStrokeColor(HexColor(LINE)); c.line(x, yy - 10, x + 260, yy - 10)
            ptext(c, row, x, yy + 4, 12, j == 0, HexColor(INK if j == 0 else MUTED))
    paragraph(c, "shipment_id menjadi jembatan antara perjalanan paket dan pencairan COD. user_id menjaga seluruh relasi tetap berada pada akun yang sama.", 54, 80, 820, 13, 19, HexColor(INK))
    c.showPage()

    # 4 - ERD
    page_header(c, "03 - ERD", "Relasi utama dan atribut kunci", 4)
    c.drawImage(ImageReader(str(erd_path)), 48, 38, width=width - 96, height=height - 165, preserveAspectRatio=True, anchor="c", mask="auto")
    c.showPage()

    # 5 - SQL screenshot
    page_header(c, "04 - SQL", "Skema lengkap dapat diperiksa dalam satu file", 5)
    c.drawImage(ImageReader(str(sql_shot)), 50, 118, width=858, height=288, preserveAspectRatio=True, anchor="c", mask="auto")
    ptext(c, "Sumber deployment", 62, 82, 11, True, HexColor(INK))
    paragraph(c, "File migration tetap menjadi sumber deployment. 00_full_schema.sql menggabungkannya agar proses penilaian lebih mudah.", 200, 82, 690, 10, 14, HexColor(MUTED))
    c.showPage()

    # 6 - sample data screenshot
    page_header(c, "05 - Sample data", "Data contoh mencakup alur normal dan kendala", 6)
    c.drawImage(ImageReader(str(seed_shot)), 50, 118, width=858, height=288, preserveAspectRatio=True, anchor="c", mask="auto")
    ptext(c, "Akun demo", 62, 82, 11, True, HexColor(INK))
    paragraph(c, "demo@contoh.test | resi ANT-100015 | kode akses 260926. Seed juga memuat settlement, impor bank, tiket, preferensi, dan outbox.", 200, 82, 690, 10, 14, HexColor(MUTED))
    c.showPage()

    # 7 - documentation screenshot
    page_header(c, "06 - Dokumentasi", "Setup dan verifikasi dapat diikuti dari awal", 7)
    c.drawImage(ImageReader(str(doc_shot)), 50, 118, width=858, height=288, preserveAspectRatio=True, anchor="c", mask="auto")
    ptext(c, "Panduan utama", 62, 82, 11, True, HexColor(INK))
    paragraph(c, "database/DATABASE_RUN.md menjelaskan setup lokal, SQL Editor, smoke test, alur verifikasi, integritas, dan troubleshooting.", 200, 82, 690, 10, 14, HexColor(MUTED))
    c.showPage()

    # 8 - normalization
    page_header(c, "07 - Normalisasi", "Struktur 3NF dengan denormalisasi yang terukur", 8)
    y = 375
    y = draw_bullet(c, 58, y, "1NF - nilai atomik", "Timeline dan settlement item menjadi baris terpisah, bukan array di tabel induk.", 390)
    y = draw_bullet(c, 58, y, "2NF - bergantung pada relasi", "Komponen COD dan fee berada pada pasangan settlement-shipment.", 390)
    y = draw_bullet(c, 58, y, "3NF - master tidak diulang", "Kategori, header impor, detail impor, header settlement, dan profil user dipisah.", 390)
    y2 = 375
    y2 = draw_bullet(c, 510, y2, "Composite FK", "shipment_id atau settlement_id selalu dipasangkan dengan user_id pada relasi kritis.", 390)
    y2 = draw_bullet(c, 510, y2, "Constraint dan generated column", "Status, nominal, koordinat, panjang input, dan nilai bersih divalidasi oleh PostgreSQL.", 390)
    y2 = draw_bullet(c, 510, y2, "Snapshot yang disengaja", "Tiket CS dan outbox menyimpan JSON immutable untuk audit dan retry.", 390)
    c.showPage()

    # 9 - submit
    page_header(c, "08 - Pengumpulan", "Branch dan paket siap diperiksa", 9)
    ptext(c, "Branch", 62, 372, 12, True, HexColor(MAGENTA))
    ptext(c, "6-db", 62, 330, 34, True, HexColor(INK))
    ptext(c, "Link repository", 62, 270, 12, True, HexColor(MAGENTA))
    ptext(c, BRANCH_URL, 62, 240, 11, False, HexColor(INK))
    c.linkURL(BRANCH_URL, (62, 232, 780, 258), relative=0)
    ptext(c, "Isi branch", 62, 176, 12, True, HexColor(MAGENTA))
    paragraph(c, "File SQL, sample data, ERD .webp, kamus data, pemetaan FRD, penjelasan normalisasi, run guide, query verifikasi, dan PDF pengumpulan.", 62, 148, 760, 12, 18, HexColor(INK))
    ptext(c, "Berkas LMS: day6-database-report.pdf", 62, 74, 11, True, HexColor(INK))
    c.showPage()
    c.save()


def build_zip() -> None:
    selected = [
        DB / "00_full_schema.sql",
        DB / "01_sample_data.sql",
        DB / "02_verify_schema.sql",
        DB / "03_smoke_test.sql",
        DB / "04_relations.sql",
        DB / "README.md",
        DB / "DATABASE_RUN.md",
        DB / "DATA_DICTIONARY.md",
        DB / "FRD_DATA_MAPPING.md",
        DB / "NORMALIZATION.md",
        DB / "ERD.md",
        ERD_DIR / "anteraja-database-erd.webp",
        ROOT / "docs" / "submission" / "DAY6_DATABASE_SUBMISSION.md",
        PDF_PATH,
    ]
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr("BRANCH_LINK.txt", BRANCH_URL + "\n")
        for source in selected:
            if source == PDF_PATH:
                arcname = Path("LMS") / source.name
            else:
                arcname = source.relative_to(ROOT)
            archive.write(source, arcname.as_posix())


def main() -> None:
    ensure_dirs()
    build_full_schema()
    build_sample_data()
    erd = build_erd()
    sql_shot = SCREEN_DIR / "sql-schema-preview.webp"
    seed_shot = SCREEN_DIR / "sample-data-preview.webp"
    doc_shot = SCREEN_DIR / "documentation-preview.webp"
    code_screenshot(DB / "00_full_schema.sql", sql_shot, "00_full_schema.sql", 0, 28)
    code_screenshot(DB / "01_sample_data.sql", seed_shot, "01_sample_data.sql", 92, 28)
    doc_screenshot(DB / "DATABASE_RUN.md", doc_shot)
    build_pdf(erd, sql_shot, seed_shot, doc_shot)
    build_zip()
    print(f"ERD: {erd}")
    print(f"PDF: {PDF_PATH}")
    print(f"ZIP: {ZIP_PATH}")


if __name__ == "__main__":
    main()
