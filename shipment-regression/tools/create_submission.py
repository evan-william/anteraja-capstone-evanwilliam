"""build the LMS report from executed JSON and original browser screenshots."""
import argparse
import io
import json
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak

ROOT = Path(__file__).resolve().parents[1]
args = argparse.ArgumentParser()
args.add_argument('--workflow', type=Path, default=ROOT / 'docs/git-workflow.json')
args.add_argument('--output', type=Path, default=ROOT / 'output/pdf/Day21-Puppeteer-Regression.pdf')
options = args.parse_args()
results = json.loads((ROOT / 'test-results.json').read_text(encoding='utf-8'))
summary = json.loads((ROOT / 'run-summary.json').read_text(encoding='utf-8'))
workflow = json.loads(options.workflow.read_text(encoding='utf-8'))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCustom', fontName='Helvetica-Bold', fontSize=25, leading=29, spaceAfter=14))
styles.add(ParagraphStyle(name='BodyCustom', fontName='Helvetica', fontSize=10, leading=15, spaceAfter=9))
styles.add(ParagraphStyle(name='SmallCustom', fontName='Helvetica', fontSize=8, leading=11, spaceAfter=6))
styles.add(ParagraphStyle(name='SectionCustom', fontName='Helvetica-Bold', fontSize=14, leading=18, spaceAfter=10))
styles.add(ParagraphStyle(name='CellCustom', fontName='Helvetica', fontSize=8, leading=10))
story = []

def paragraph(text, style='BodyCustom'):
    story.append(Paragraph(text, styles[style]))

def title(number, text):
    paragraph(f'DAY 21 / {number}', 'SmallCustom')
    paragraph(text, 'TitleCustom')

def table(rows, widths):
    cells = [[Paragraph(escape(str(cell)), styles['CellCustom']) for cell in row] for row in rows]
    item = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
    item.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eeeeee')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, colors.HexColor('#cccccc')),
    ]))
    story.append(item)
    story.append(Spacer(1, 12))

def screenshot(scenario, stage, width, crop=None):
    row = next(row for row in results if row['id'] == scenario)
    image = PILImage.open(ROOT / row['evidence'][stage]).convert('RGB')
    if crop:
        image = image.crop(crop)
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG', quality=83, optimize=True)
    buffer.seek(0)
    return Image(buffer, width=width, height=width * image.height / image.width)

title('01', 'Shipment workflow,\ndiuji berulang.')
paragraph('Evan William - Reusable Shipment Regression Test - 12 Oktober 2026', 'SmallCustom')
paragraph(f'<b>{summary["pass"]} PASS / {summary["fail"]} FAIL</b> dari {summary["total"]} skenario. Hasil berasal dari eksekusi Puppeteer, bukan tabel yang diisi manual.')
paragraph('Form dibuka, data diisi, submit diklik, lalu hasil dibandingkan dengan expected. SUCCESS harus menghasilkan baris riwayat yang tepat; input invalid harus ditolak tanpa mengubah riwayat.')
paragraph(f'<b>Branch:</b> <a href="{workflow["branchUrl"]}">feature/puppeteer-regression</a><br/><b>PR:</b> <a href="{workflow["pr"]["url"]}">{workflow["pr"]["url"]}</a>', 'SmallCustom')
paragraph('Expected vs actual', 'SectionCustom')
rows = [['Scenario', 'Expected', 'Actual', 'Status']]
rows.extend([[r['scenario'], r['expected'], r['actual'], r['status']] for r in results])
table(rows, [190, 123, 123, 55])
paragraph('Empat SUCCESS, enam VALIDATION_ERROR. Negative test juga PASS saat aplikasi menolak input sesuai requirement. Screenshot adalah bukti tampilan, bukan penentu PASS.', 'SmallCustom')
paragraph('Aplikasi sumber: latihan PHP OOP/Form/Session Day 13. Salinan terisolasi menyimpan riwayat pada session browser; tidak menulis ke Supabase atau mengubah capstone Full.', 'SmallCustom')
story.append(PageBreak())

title('02', 'Happy path: paket tercatat.')
paragraph('<b>Baseline sebelum runner:</b> ANT-001, 5 kg, 25 km. Submit interaktif melalui browser tools menghasilkan satu row riwayat dan Rp43.750. Ini bukan klaim klik manual oleh Evan.')
paragraph('Screenshot form sebelum submit (crop agar field terbaca).', 'SmallCustom')
story.append(screenshot('normal-shipment', 'form', 355, (114, 407, 695, 905)))
story.append(Spacer(1, 10))
paragraph('Screenshot hasil: pesan sukses dan row Request History. PNG asli lengkap ada di paket.', 'SmallCustom')
story.append(screenshot('normal-shipment', 'result', 491, (114, 216, 1166, 700)))
paragraph('Assertion: HTTP 200; riwayat 0 menjadi 1; resi ANT-001; berat 5; jarak 25; biaya 43750. Expected tarif independen: 25000 + 15 x 1250 = 43750.', 'SmallCustom')
story.append(PageBreak())

title('03', 'Input salah ditolak.')
paragraph('Dua kasus wajib menguji validasi browser. Resi berisi spasi menguji validasi PHP: HTML required tidak mendeteksi spasi kosong, tetapi server menolaknya.')
screens = Table([[
    screenshot('missing-tracking', 'result', 238, (114, 407, 695, 905)),
    screenshot('invalid-weight', 'result', 238, (114, 407, 695, 905)),
]], colWidths=[247, 247])
screens.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
story.append(screens)
story.append(Spacer(1, 8))
table([
    ['Missing Tracking', 'Invalid Weight'],
    ['actual: VALIDATION_ERROR\nvalueMissing: true\nPOST: 0; history: 0', 'actual: VALIDATION_ERROR\nrangeUnderflow: true\nPOST: 0; history: 0'],
], [247, 247])
paragraph('Penolakan server - resi hanya spasi', 'SectionCustom')
story.append(screenshot('blank-tracking-server', 'result', 491, (114, 175, 1166, 520)))
paragraph('Actual: VALIDATION_ERROR, HTTP 422, pesan "Nomor resi wajib diisi.", dan riwayat tetap kosong. HTTP 500 tidak diterima sebagai keberhasilan negative test.', 'SmallCustom')
story.append(PageBreak())

title('04', 'Runner yang bisa dipakai lagi.')
paragraph('Satu runner membaca shipment-test-data.json dan memproses skenario berurutan. Context/session baru per skenario mencegah hasil lama menghasilkan false PASS.')
table([
    ['Bagian', 'Verification / evidence'],
    ['Stable selector', '#tracking-number, #weight, #distance, form button[type="submit"], #request-history'],
    ['Waiting', 'waitForSelector; waitForFunction pada event invalid; Promise.all(waitForNavigation, click). Tidak ada delay acak untuk menentukan hasil.'],
    ['Report nyata', 'test-results.json: input, expected, actual, PASS/FAIL, validation, history before/after, biaya, durasi, error dan path screenshot.'],
    ['Screenshot', '20 PNG: form dan result untuk tiap skenario. Manifest SHA-256 menghubungkan report dengan berkas evidence.'],
    ['Tambahan verifikasi', '6 unit test assertion; 18 pemeriksaan PHP. Suite diulang dan tetap 10 PASS / 0 FAIL.'],
    ['Self-check', 'Expected biaya sengaja diubah menjadi Rp1. Actual SUCCESS Rp43.750 menghasilkan FAIL dan exit code 1. Report utama tidak ditimpa.'],
], [118, 373])
paragraph('Perintah untuk menjalankan ulang', 'SectionCustom')
paragraph('<font face="Courier">npm ci<br/>npm test<br/>npm run test:headed<br/>npm run test:unit<br/>npm run test:self-check</font>')
paragraph('Node 22.12+, Chrome desktop, PHP 8.2+. npm test menjalankan server lokal 3122 lalu menutup server miliknya. PHP_BIN dan CHROME_PATH dapat diisi bila deteksi executable tidak berhasil. BASE_URL hanya mengizinkan app latihan lokal.')
paragraph(f'Eksekusi terakhir: {escape(summary["startedAt"])} sampai {escape(summary["finishedAt"])} (UTC). Node: {escape(summary["node"])}.', 'SmallCustom')
story.append(PageBreak())

title('05', 'Bukti Git dan kesimpulan.')
paragraph(f'<b>PR #{workflow["pr"]["number"]}:</b> <a href="{workflow["pr"]["url"]}">{workflow["pr"]["url"]}</a><br/>Target: {escape(workflow["pr"]["base"])}; tidak menyentuh main.', 'SmallCustom')
rows = [['Commit', 'Perubahan modular']]
rows.extend([[c['sha'][:12], c['subject']] for c in reversed(workflow['commits'])])
table(rows, [112, 379])
paragraph('Status workflow', 'SectionCustom')
paragraph(f'Branch sudah dipush. PR berstatus <b>{"MERGED" if workflow["pr"]["merged"] else "OPEN"}</b> pada snapshot {escape(workflow["capturedAt"])}. <b>Partner review tidak dilakukan</b> sesuai arahan pemilik proyek; bagian rubrik tersebut tidak diklaim terpenuhi.')
paragraph('Kesimpulan', 'SectionCustom')
paragraph('Alur Shipment Request stabil untuk 10 skenario yang dijalankan pada versi ini. Happy path memverifikasi data di riwayat dan nominal; negative/edge case memastikan input salah tidak disimpan. Tidak ada error JavaScript pada suite.')
paragraph('Cakupan ini bukan jaminan seluruh capstone bebas bug atau bukti layanan pengiriman nyata. Tidak ada perubahan schema/RLS, tidak ada credential yang diperlukan, dan riwayat latihan bukan database permanen.')
paragraph('Isi pengumpulan', 'SectionCustom')
paragraph('ZIP memuat app sumber latihan, runner, dataset JSON, dokumentasi, test-results.json, run-summary.json, manifest, dan 20 screenshot. node_modules serta PHP session tidak disertakan. npm ci memasang dependency dari lockfile.')

def footer(canvas, document):
    canvas.setStrokeColor(colors.HexColor('#cccccc'))
    canvas.line(42, 35, A4[0] - 42, 35)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(42, 22, 'Evan William / Shipment Regression / Day 21')
    canvas.drawRightString(A4[0] - 42, 22, str(document.page))

options.output.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(str(options.output), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=35, bottomMargin=48,
                             title='Day 21 - Shipment Puppeteer Regression', author='Evan William')
document.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'PDF: {options.output} ({options.output.stat().st_size} bytes)')
