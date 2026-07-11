from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


def percentile(values: Iterable[float], probability: float) -> float:
    ordered = sorted(values)
    if not ordered:
        raise ValueError("percentile requires at least one value")
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    weight = position - lower
    return ordered[lower] * (1.0 - weight) + ordered[upper] * weight


def summarize(latencies: list[float]) -> dict[str, float | int]:
    if not latencies:
        raise ValueError("No accepted latency values")
    return {
        "n": len(latencies),
        "mean_ms": round(statistics.fmean(latencies), 3),
        "median_ms": round(statistics.median(latencies), 3),
        "stddev_ms": round(statistics.stdev(latencies), 3) if len(latencies) > 1 else 0.0,
        "min_ms": round(min(latencies), 3),
        "p95_ms": round(percentile(latencies, 0.95), 3),
        "max_ms": round(max(latencies), 3),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize accepted hardware latency trials.")
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--min-trials", type=int, default=30)
    parser.add_argument("--output-dir", type=Path, default=Path("research/data/processed"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    groups: dict[tuple[str, str, str], list[float]] = defaultdict(list)
    rejected: dict[tuple[str, str, str], int] = defaultdict(int)

    for path in args.inputs:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                key = (row["network_label"], row["endpoint"], row.get("source") or "unknown")
                if row.get("accepted", "").lower() != "true" or row.get("http_status") != "200":
                    rejected[key] += 1
                    continue
                groups[key].append(float(row["latency_ms"]))

    if not groups:
        raise SystemExit("No accepted real-hardware trials were found")

    summaries = []
    insufficient = False
    for key in sorted(groups):
        network, endpoint, source = key
        result = summarize(groups[key])
        result.update(
            {
                "network_label": network,
                "endpoint": endpoint,
                "source": source,
                "rejected_n": rejected[key],
                "meets_min_trials": result["n"] >= args.min_trials,
            }
        )
        insufficient = insufficient or not bool(result["meets_min_trials"])
        summaries.append(result)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / "hardware_latency_summary.json"
    json_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
                "minimumTrials": args.min_trials,
                "groups": summaries,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    csv_path = args.output_dir / "hardware_latency_summary.csv"
    fields = ["network_label", "endpoint", "source", "n", "rejected_n", "mean_ms", "median_ms", "stddev_ms", "min_ms", "p95_ms", "max_ms", "meets_min_trials"]
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(summaries)

    print(json_path)
    print(csv_path)
    return 2 if insufficient else 0


if __name__ == "__main__":
    raise SystemExit(main())
