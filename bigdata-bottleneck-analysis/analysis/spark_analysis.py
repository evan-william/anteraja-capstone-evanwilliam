"""Spark transformations shared by the executed notebook and independent tests."""
import csv
import json
from pathlib import Path
from pyspark.sql import functions as F, types as T

FIELDS = ["hub_id", "package_id", "event_type", "timestamp"]
SCHEMA = T.StructType([T.StructField(name, T.StringType(), True) for name in FIELDS])


def quality_check(raw):
    """Keep invalid scans in group audits; reject ambiguous visits conservatively."""
    assert raw.columns == FIELDS, f"Unexpected columns: {raw.columns}"
    assert all(isinstance(f.dataType, T.StringType) for f in raw.schema.fields)
    missing_key = (F.col("hub_id").isNull() | (F.trim("hub_id") == "") |
                   F.col("package_id").isNull() | (F.trim("package_id") == ""))
    distinct = raw.dropDuplicates(FIELDS)
    keyed = distinct.filter(~missing_key).withColumn(
        "parsed_at", F.try_to_timestamp("timestamp", F.lit("yyyy-MM-dd'T'HH:mm:ss'Z'")))
    groups = keyed.groupBy("hub_id", "package_id").agg(
        F.sum(F.when(F.col("event_type") == "ARRIVAL", 1).otherwise(0)).alias("arrival_count"),
        F.sum(F.when(F.col("event_type") == "DEPARTURE", 1).otherwise(0)).alias("departure_count"),
        F.sum(F.when(F.col("parsed_at").isNull(), 1).otherwise(0)).alias("invalid_timestamp_count"),
        F.sum(F.when(F.col("event_type").isin("ARRIVAL", "DEPARTURE"), 0).otherwise(1)).alias("unknown_event_count"),
        F.min(F.when(F.col("event_type") == "ARRIVAL", F.col("parsed_at"))).alias("arrival_at"),
        F.min(F.when(F.col("event_type") == "DEPARTURE", F.col("parsed_at"))).alias("departure_at"))
    flags = {
        "missing_arrival": F.col("arrival_count") == 0,
        "missing_departure": F.col("departure_count") == 0,
        "invalid_timestamp": F.col("invalid_timestamp_count") > 0,
        "unknown_event": F.col("unknown_event_count") > 0,
        "ambiguous_pair": (F.col("arrival_count") > 1) | (F.col("departure_count") > 1),
        "departure_before_arrival": F.coalesce(F.col("departure_at") < F.col("arrival_at"), F.lit(False)),
    }
    for name, condition in flags.items():
        groups = groups.withColumn(name, condition)
    eligible = F.lit(True)
    for name in flags:
        eligible = eligible & ~F.col(name)
    groups = groups.withColumn("is_valid_pair", eligible).cache()
    duplicates = raw.groupBy(FIELDS).count().filter(F.col("count") > 1)
    duplicate_hubs = duplicates.filter(~missing_key).groupBy("hub_id").agg(
        F.sum(F.col("count") - 1).alias("duplicate_extra_events"))
    quality = groups.groupBy("hub_id").agg(
        F.count("*").alias("candidate_pairs"),
        F.sum(F.col("is_valid_pair").cast("int")).alias("valid_pairs"),
        *[F.sum(F.col(n).cast("int")).alias(n) for n in flags]).join(
            duplicate_hubs, "hub_id", "left").fillna(0, ["duplicate_extra_events"]).withColumn(
                "valid_pair_pct", 100 * F.col("valid_pairs") / F.col("candidate_pairs"))
    summary = {"raw_events": raw.count(), "deduplicated_events": distinct.count(),
               "duplicate_extra_events": raw.count() - distinct.count(),
               "missing_key_events": raw.filter(missing_key).count(),
               "invalid_timestamp_events": keyed.filter(F.col("parsed_at").isNull()).count(),
               "candidate_pairs": groups.count(),
               "valid_pairs": groups.filter("is_valid_pair").count()}
    for flag in flags:
        summary[flag + "_pairs"] = groups.filter(F.col(flag)).count()
    summary["excluded_pairs"] = summary["candidate_pairs"] - summary["valid_pairs"]
    return groups, quality, summary


def dwell_and_hubs(groups, quality):
    dwell = groups.filter("is_valid_pair").select("hub_id", "package_id", "arrival_at", "departure_at").withColumn(
        "dwell_hours", (F.unix_timestamp("departure_at") - F.unix_timestamp("arrival_at")) / 3600)
    hubs = dwell.groupBy("hub_id").agg(
        F.count("*").alias("package_count"),
        F.avg("dwell_hours").alias("avg_dwell_hours"),
        F.expr("percentile(dwell_hours, 0.5)").alias("median_dwell_hours")
    ).join(quality, "hub_id").orderBy(F.desc("avg_dwell_hours"), "hub_id")
    return dwell, hubs


def write_csv(frame, path):
    # Stream output to disk instead of collecting all package rows into driver RAM.
    with Path(path).open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=frame.columns)
        writer.writeheader()
        for row in frame.toLocalIterator():
            writer.writerow(row.asDict())


def export_results(groups, quality, summary, output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    dwell, hubs = dwell_and_hubs(groups, quality)
    write_csv(dwell.orderBy("hub_id", "package_id"), output / "package_dwell.csv")
    write_csv(groups.orderBy("hub_id", "package_id"), output / "pair_audit.csv")
    write_csv(quality.orderBy("hub_id"), output / "hub_quality.csv")
    write_csv(hubs, output / "all_hubs.csv")
    write_csv(hubs.limit(5), output / "top_bottleneck_hubs.csv")
    (output / "quality_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return dwell, hubs
