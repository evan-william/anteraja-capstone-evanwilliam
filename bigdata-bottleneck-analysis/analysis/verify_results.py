"""Independent stdlib oracle verifies exported Spark results, not Spark formulas."""
import csv
import json
import math
import statistics
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    with (ROOT / name).open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def verify():
    checks = []
    def check(name, condition):
        assert condition, name
        checks.append(name)
    raw = read("data/scan_events.csv")
    unique = {tuple(r[k] for k in ("hub_id", "package_id", "event_type", "timestamp")) for r in raw}
    source = defaultdict(list)
    for h, p, e, t in unique:
        if h.strip() and p.strip():
            source[h, p].append((e, t))
    oracle = {}
    for key, events in source.items():
        arrivals = [t for e, t in events if e == "ARRIVAL"]
        departures = [t for e, t in events if e == "DEPARTURE"]
        if len(arrivals) != 1 or len(departures) != 1 or any(e not in {"ARRIVAL", "DEPARTURE"} for e, _ in events):
            continue
        try:
            a = datetime.strptime(arrivals[0], "%Y-%m-%dT%H:%M:%SZ")
            d = datetime.strptime(departures[0], "%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            continue
        if d >= a:
            oracle[key] = (d - a).total_seconds() / 3600
    dwell = read("output/package_dwell.csv")
    actual = {(r["hub_id"], r["package_id"]): float(r["dwell_hours"]) for r in dwell}
    truth = json.loads((ROOT / "data/ground_truth.json").read_text())
    expected = {(r["hub_id"], r["package_id"]): r["dwell_hours"] for r in truth}
    check("Pair keys equal independent event parser", actual.keys() == oracle.keys())
    check("Pair keys equal generator ground truth", actual.keys() == expected.keys())
    check("Every dwell equals parsed time delta", all(math.isclose(v, oracle[k], abs_tol=1e-9) for k, v in actual.items()))
    check("Every dwell equals known generator hours", all(math.isclose(v, expected[k], abs_tol=1e-9) for k, v in actual.items()))
    check("No duplicate pair", len(actual) == len(dwell))
    check("No negative dwell", all(v >= 0 for v in actual.values()))
    by_hub = defaultdict(list)
    for (h, p), v in oracle.items():
        by_hub[h].append(v)
    hubs = read("output/all_hubs.csv")
    for h in hubs:
        values = by_hub[h["hub_id"]]
        check(h["hub_id"] + " package count", int(h["package_count"]) == len(values))
        check(h["hub_id"] + " mean", math.isclose(float(h["avg_dwell_hours"]), statistics.mean(values), abs_tol=1e-9))
        check(h["hub_id"] + " exact median", math.isclose(float(h["median_dwell_hours"]), statistics.median(values), abs_tol=1e-9))
        check(h["hub_id"] + " quality denominator", int(h["candidate_pairs"]) == len(values) + 17)
        check(h["hub_id"] + " valid percentage", math.isclose(float(h["valid_pair_pct"]), 100 * len(values)/(len(values)+17), abs_tol=1e-9))
    top = read("output/top_bottleneck_hubs.csv")
    check("Top contains exactly five hubs", len(top) == 5)
    check("Top equals first five full ranking", top == hubs[:5])
    check("Descending average order", [float(h["avg_dwell_hours"]) for h in hubs] == sorted([float(h["avg_dwell_hours"]) for h in hubs], reverse=True))
    summary = json.loads((ROOT / "output/quality_summary.json").read_text())
    expected_summary = {"raw_events":len(raw), "deduplicated_events":len(unique),
        "duplicate_extra_events":24, "missing_key_events":2,
        "invalid_timestamp_events":24, "candidate_pairs":len(truth)+136,
        "valid_pairs":len(truth), "excluded_pairs":136,
        "missing_arrival_pairs":40, "missing_departure_pairs":40,
        "invalid_timestamp_pairs":24, "unknown_event_pairs":8,
        "ambiguous_pair_pairs":8, "departure_before_arrival_pairs":16}
    for k, v in expected_summary.items():
        check("Quality " + k, summary[k] == v)
    audit = read("output/pair_audit.csv")
    check("Excluded count matches audit flags", sum(r["is_valid_pair"].lower() == "false" for r in audit) == 136)
    insight = (ROOT / "output/business_insight.txt").read_text(encoding="utf-8")
    check("Insight contains justified MKS priority and remote caution", "HUB_MKS" in insight and "HUB_REMOTE" in insight and "350" in insight)
    result = {"passed":len(checks), "failed":0, "checks":checks}
    (ROOT / "output/verification.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({"passed":len(checks), "failed":0}))


if __name__ == "__main__":
    verify()
