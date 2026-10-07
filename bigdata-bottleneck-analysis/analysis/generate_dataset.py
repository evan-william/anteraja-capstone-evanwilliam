"""Deterministic simulated scans; no production shipment data is accessed."""
import csv
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
ROOT = MODULE_DIR.parent if MODULE_DIR.name == "analysis" else MODULE_DIR


def generate():
    rng = random.Random(1818)
    rows, truth = [], []
    start = datetime(2026, 9, 1, tzinfo=timezone.utc)
    # Count, normal dwell, spread; a small sample has a deliberately high mean.
    hubs = {"HUB_JKT": (500, 3, 1), "HUB_SBY": (400, 5, 2),
            "HUB_MKS": (350, 11, 2), "HUB_BDG": (300, 4, 1),
            "HUB_SMG": (250, 7, 2), "HUB_DPS": (200, 9, 2),
            "HUB_MED": (180, 6, 2), "HUB_REMOTE": (2, 30, 0)}
    fmt = lambda value: value.strftime("%Y-%m-%dT%H:%M:%SZ")
    for hub, (count, base, spread) in hubs.items():
        for i in range(count):
            package = f"PKG-{i:05d}"  # Same package can visit more than one hub.
            arrival = start + timedelta(hours=rng.randrange(600), minutes=i % 60)
            hours = round(base + rng.uniform(-spread, spread), 2)
            departure = arrival + timedelta(seconds=round(hours * 3600))
            rows.extend([(hub, package, "ARRIVAL", fmt(arrival)),
                         (hub, package, "DEPARTURE", fmt(departure))])
            truth.append({"hub_id": hub, "package_id": package, "dwell_hours": hours})
        # Explicit quality fixtures per hub; none are included in ground truth.
        a, d = fmt(start), fmt(start + timedelta(hours=3))
        for i in range(5):
            rows.append((hub, f"MISS-A-{i}", "DEPARTURE", d))
            rows.append((hub, f"MISS-D-{i}", "ARRIVAL", a))
        for i in range(3):
            rows.extend([(hub, f"BAD-TS-{i}", "ARRIVAL", "not-a-date"),
                         (hub, f"BAD-TS-{i}", "DEPARTURE", d)])
        for i in range(2):
            rows.extend([(hub, f"REVERSE-{i}", "ARRIVAL", d),
                         (hub, f"REVERSE-{i}", "DEPARTURE", a)])
        rows.extend([(hub, "AMBIGUOUS", "ARRIVAL", a),
                     (hub, "AMBIGUOUS", "ARRIVAL", fmt(start + timedelta(hours=1))),
                     (hub, "AMBIGUOUS", "DEPARTURE", d),
                     (hub, "UNKNOWN", "ARRIVAL", a), (hub, "UNKNOWN", "DEPARTURE", d),
                     (hub, "UNKNOWN", "SCAN_OTHER", a)])
        rows.extend([rows[next(j for j, row in enumerate(rows)
                                     if row[0] == hub and row[1] == "PKG-00000")]] * 3)
    rows.extend([("", "MISSING-HUB", "ARRIVAL", fmt(start)),
                 ("HUB_JKT", "", "DEPARTURE", fmt(start))])
    rng.shuffle(rows)
    (ROOT / "data").mkdir(parents=True, exist_ok=True)
    with (ROOT / "data/scan_events.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["hub_id", "package_id", "event_type", "timestamp"])
        writer.writerows(rows)
    (ROOT / "data/ground_truth.json").write_text(json.dumps(truth, indent=2), encoding="utf-8")
    print(f"Generated {len(rows)} events; {len(truth)} valid package/hub pairs.")


if __name__ == "__main__":
    generate()
