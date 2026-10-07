"""Real Spark tests for scan pairing boundary conditions."""
import os
import sys
import csv
import tempfile
from pathlib import Path
from prepare_runtime import prepare_runtime
prepare_runtime()
from pyspark.sql import SparkSession
from spark_analysis import SCHEMA, quality_check, dwell_and_hubs

def test():
    spark = SparkSession.builder.master("local[2]").appName("scan-edge-tests").config("spark.sql.session.timeZone", "UTC").config("spark.sql.shuffle.partitions", "2").getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    a, d = "2026-09-01T00:00:00Z", "2026-09-01T03:00:00Z"
    rows = [("H", "normal", "ARRIVAL", a), ("H", "normal", "DEPARTURE", d),
            ("H", "normal", "ARRIVAL", a),
            ("H", "zero", "ARRIVAL", a), ("H", "zero", "DEPARTURE", a),
            ("H", "reverse", "ARRIVAL", d), ("H", "reverse", "DEPARTURE", a),
            ("H", "missing-a", "DEPARTURE", d), ("H", "missing-d", "ARRIVAL", a),
            ("H", "bad", "ARRIVAL", "invalid"), ("H", "bad", "DEPARTURE", d),
            ("H", "ambiguous", "ARRIVAL", a), ("H", "ambiguous", "ARRIVAL", d), ("H", "ambiguous", "DEPARTURE", d),
            ("H", "unknown", "ARRIVAL", a), ("H", "unknown", "DEPARTURE", d), ("H", "unknown", None, a),
            (None, "missing-hub", "ARRIVAL", a), ("H", None, "ARRIVAL", a),
            ("H", "null-time", "ARRIVAL", None), ("H", "null-time", "DEPARTURE", d),
            ("H", "partial-bad", "ARRIVAL", a), ("H", "partial-bad", "DEPARTURE", d),
            ("H", "partial-bad", "ARRIVAL", "invalid"),
            ("OTHER", "normal", "ARRIVAL", a), ("OTHER", "normal", "DEPARTURE", d)]
    fixture_dir = tempfile.TemporaryDirectory(prefix="day18-edge-")
    def fixture(name, values):
        path = Path(fixture_dir.name) / name
        with path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["hub_id", "package_id", "event_type", "timestamp"])
            writer.writerows(values)
        return spark.read.option("header", True).schema(SCHEMA).csv(str(path))
    try:
        # Exercise the same JVM CSV ingestion used by the analysis, not a Python RDD.
        groups, quality, summary = quality_check(fixture("cases.csv", rows))
        dwell, hubs = dwell_and_hubs(groups, quality)
        result = {(r.hub_id, r.package_id):r.dwell_hours for r in dwell.collect()}
        assert result == {("H", "normal"):3., ("H", "zero"):0., ("OTHER", "normal"):3.}
        assert summary["duplicate_extra_events"] == 1
        assert summary["missing_key_events"] == 2
        assert summary["invalid_timestamp_events"] == 3
        assert summary["excluded_pairs"] == 8
        assert summary["departure_before_arrival_pairs"] == 1
        assert summary["unknown_event_pairs"] == 1
        assert summary["ambiguous_pair_pairs"] == 2
        h = next(r for r in hubs.collect() if r.hub_id == "H")
        assert h.package_count == 2 and h.avg_dwell_hours == 1.5 and h.median_dwell_hours == 1.5
        # Empty datasets must remain empty without manufacturing zero-time pairs.
        empty_groups, empty_quality, empty_summary = quality_check(fixture("empty.csv", []))
        empty_dwell, empty_hubs = dwell_and_hubs(empty_groups, empty_quality)
        assert empty_summary["raw_events"] == 0 and empty_dwell.count() == 0 and empty_hubs.count() == 0
        groups.unpersist()
        empty_groups.unpersist()
        print("PASS: 10 Spark assertions (nulls, duplicates, zero dwell, ambiguous visits, reversed times, empty input).")
    finally:
        spark.stop()
        fixture_dir.cleanup()

if __name__ == "__main__":
    test()
