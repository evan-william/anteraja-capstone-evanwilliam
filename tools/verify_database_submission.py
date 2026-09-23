from __future__ import annotations

import re
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "database"
ZIP_PATH = ROOT.parent / "Anteraja-Database-Day-6-Evan-William.zip"

EXPECTED_TABLES = {
    "users",
    "categories",
    "transactions",
    "bank_imports",
    "bank_import_rows",
    "category_rules",
    "shipments",
    "shipment_events",
    "shipment_resolutions",
    "support_tickets",
    "notification_preferences",
    "integration_outbox",
    "tracking_rate_limits",
    "settlements",
    "settlement_items",
}

EXPECTED_FUNCTIONS = {
    "handle_new_user",
    "set_updated_at",
    "save_bank_import",
    "cancel_bank_import",
    "recalculate_settlement_totals",
    "link_bank_row_to_settlement",
    "evaluate_shipment_risk",
    "consume_tracking_rate_limit",
    "get_public_tracking",
    "submit_tracking_resolution",
    "create_tracking_ticket",
    "set_tracking_notifications",
}


def main() -> None:
    schema = (DB / "00_full_schema.sql").read_text(encoding="utf-8")
    sample = (DB / "01_sample_data.sql").read_text(encoding="utf-8")

    found_tables = set(
        re.findall(
            r"create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_]+)",
            schema,
            flags=re.IGNORECASE,
        )
    )
    assert found_tables == EXPECTED_TABLES, (found_tables, EXPECTED_TABLES - found_tables)

    for table in EXPECTED_TABLES:
        assert re.search(
            rf"alter\s+table\s+public\.{table}\s+enable\s+row\s+level\s+security",
            schema,
            flags=re.IGNORECASE,
        ), f"RLS declaration missing for {table}"

    found_functions = set(
        re.findall(
            r"create\s+or\s+replace\s+function\s+public\.([a-z_]+)",
            schema,
            flags=re.IGNORECASE,
        )
    )
    assert EXPECTED_FUNCTIONS <= found_functions, EXPECTED_FUNCTIONS - found_functions

    sample_tables = {
        "users",
        "categories",
        "transactions",
        "shipments",
        "shipment_events",
        "settlements",
        "settlement_items",
        "category_rules",
        "bank_imports",
        "bank_import_rows",
        "shipment_resolutions",
        "support_tickets",
        "notification_preferences",
        "integration_outbox",
    }
    for table in sample_tables:
        assert re.search(rf"insert\s+into\s+public\.{table}\b", sample, re.IGNORECASE), table

    required_docs = [
        "README.md",
        "DATABASE_RUN.md",
        "DATA_DICTIONARY.md",
        "FRD_DATA_MAPPING.md",
        "NORMALIZATION.md",
        "ERD.md",
    ]
    for name in required_docs:
        assert (DB / name).is_file(), name

    erd = DB / "erd" / "anteraja-database-erd.webp"
    with Image.open(erd) as image:
        assert image.format == "WEBP"
        assert image.size == (2600, 1760)

    pdf = ROOT / "output" / "pdf" / "day6-database-report.pdf"
    assert len(PdfReader(str(pdf)).pages) == 9
    assert pdf.stat().st_size < 2 * 1024 * 1024

    with zipfile.ZipFile(ZIP_PATH) as archive:
        assert archive.testzip() is None
        names = set(archive.namelist())
        assert "database/00_full_schema.sql" in names
        assert "database/01_sample_data.sql" in names
        assert "database/erd/anteraja-database-erd.webp" in names
        assert "LMS/day6-database-report.pdf" in names
        assert "BRANCH_LINK.txt" in names

    tracked_text = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in [schema_path for schema_path in DB.rglob("*") if schema_path.is_file() and schema_path.suffix in {".sql", ".md"}]
    )
    forbidden = [r"KGAT_[A-Za-z0-9]+", r"service_role\s*=", r"sb_secret_[A-Za-z0-9]+"]
    for pattern in forbidden:
        assert not re.search(pattern, tracked_text, re.IGNORECASE), pattern

    print("DATABASE_SUBMISSION_OK")
    print(f"tables={len(found_tables)} functions={len(found_functions)} pdf_pages=9")
    print(f"pdf_bytes={pdf.stat().st_size} zip_bytes={ZIP_PATH.stat().st_size}")


if __name__ == "__main__":
    main()
