from __future__ import annotations

import argparse
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the single canonical research-results source.")
    parser.add_argument("--forecast-metrics", type=Path, required=True)
    parser.add_argument("--hardware-summary", type=Path)
    parser.add_argument("--software-evidence", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("research/results/canonical"))
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    args = parse_args()
    metrics = load_json(args.forecast_metrics)
    dataset = dict(metrics.get("dataset_summary") or {})
    model_rows: list[dict[str, Any]] = []
    for model_name, payload in dict(metrics.get("results") or {}).items():
        for split in ("validation", "test"):
            values = dict(payload.get(split) or {})
            model_rows.append(
                {
                    "model": model_name,
                    "split": split,
                    "mae_kw": values.get("mae"),
                    "rmse_kw": values.get("rmse"),
                    "mape_percent": values.get("mape"),
                    "r2": values.get("r2"),
                    "inference_ms_per_sample": values.get("inference_ms_per_sample"),
                    "mae_kw_std": values.get("mae_std"),
                    "rmse_kw_std": values.get("rmse_std"),
                    "mape_percent_std": values.get("mape_std"),
                    "r2_std": values.get("r2_std"),
                    "inference_ms_per_sample_std": values.get("inference_ms_per_sample_std"),
                    "horizon_mae": values.get("horizon_mae"),
                    "horizon_rmse": values.get("horizon_rmse"),
                    "run_count": len(payload.get("runs") or []),
                }
            )

    hardware_groups: list[dict[str, Any]] = []
    hardware_source: dict[str, Any] | None = None
    if args.hardware_summary and args.hardware_summary.exists():
        hardware = load_json(args.hardware_summary)
        hardware_groups = list(hardware.get("groups") or [])
        hardware_source = {
            "path": str(args.hardware_summary.as_posix()),
            "sha256": sha256_file(args.hardware_summary),
        }

    hardware_complete = bool(hardware_groups) and all(
        bool(group.get("meets_min_trials")) and group.get("source") == "plc-s7-1200"
        for group in hardware_groups
    )
    local_dataset = dataset.get("data_source") == "local_csv"
    required_baselines = {"persistence", "seasonal_naive_24h", "seasonal_naive_168h"}
    available_test_models = {row["model"] for row in model_rows if row["split"] == "test"}
    has_required_baselines = required_baselines.issubset(available_test_models)
    repeated_evaluation = int(dataset.get("rolling_folds") or 0) >= 3 and len(dataset.get("random_seeds") or []) >= 3
    software_evidence: dict[str, Any] | None = None
    if args.software_evidence and args.software_evidence.exists():
        software_evidence = load_json(args.software_evidence)
        software_evidence["source"] = {
            "path": str(args.software_evidence.as_posix()),
            "sha256": sha256_file(args.software_evidence),
        }

    software_permissions = (software_evidence or {}).get("claimPermissions") or {}
    software_contracts_verified = bool(
        software_permissions.get("authorizationAndHomeScope")
        and software_permissions.get("telemetryCredentialIsolation")
        and software_permissions.get("plcFeedbackAndFailClosed")
        and software_permissions.get("forecastArtifactContract")
    )

    canonical = {
        "schemaVersion": 2,
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "forecast": {
            "source": {
                "path": str(args.forecast_metrics.as_posix()),
                "sha256": sha256_file(args.forecast_metrics),
            },
            "dataset": dataset,
            "bestModel": metrics.get("best_model"),
            "models": model_rows,
            "runs": {
                model_name: list(payload.get("runs") or [])
                for model_name, payload in dict(metrics.get("results") or {}).items()
            },
        },
        "softwareEvidence": software_evidence,
        "hardware": {
            "status": "complete" if hardware_complete else "pending_real_trials",
            "source": hardware_source,
            "latencyGroups": hardware_groups,
        },
        "evidenceStatus": {
            "softwareBehaviorContracts": software_contracts_verified,
            "publicDatasetBenchmark": bool(model_rows and has_required_baselines and repeated_evaluation),
            "localMfm384Benchmark": bool(local_dataset and has_required_baselines and repeated_evaluation),
            "realHardwareLatency": hardware_complete,
            "automaticLoadShedding": False,
        },
        "claimPolicy": {
            "allowSoftwareBehaviorClaims": software_contracts_verified,
            "allowPublicDatasetForecastClaims": bool(model_rows and has_required_baselines and repeated_evaluation),
            "allowLocalAccuracyClaims": bool(local_dataset and has_required_baselines and repeated_evaluation),
            "allowMeasuredLatencyClaims": hardware_complete,
            "allowAutomaticLoadSheddingClaims": False,
            "note": "Claims marked false must remain future work or implementation status, not experimental findings.",
        },
    }

    args.output_dir.mkdir(parents=True, exist_ok=True)
    canonical_path = args.output_dir / "canonical_results.json"
    canonical_path.write_text(json.dumps(canonical, ensure_ascii=False, indent=2), encoding="utf-8")

    model_csv = args.output_dir / "forecast_metrics.csv"
    model_fields = [
        "model", "split", "mae_kw", "mae_kw_std", "rmse_kw", "rmse_kw_std",
        "mape_percent", "mape_percent_std", "r2", "r2_std",
        "inference_ms_per_sample", "inference_ms_per_sample_std", "run_count",
        "horizon_mae", "horizon_rmse",
    ]
    with model_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=model_fields)
        writer.writeheader()
        writer.writerows(model_rows)

    hardware_csv = args.output_dir / "hardware_latency.csv"
    hardware_fields = ["network_label", "endpoint", "source", "n", "rejected_n", "mean_ms", "median_ms", "stddev_ms", "min_ms", "p95_ms", "max_ms", "meets_min_trials"]
    with hardware_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=hardware_fields)
        writer.writeheader()
        for group in hardware_groups:
            writer.writerow({field: group.get(field) for field in hardware_fields})

    print(canonical_path)
    print(model_csv)
    print(hardware_csv)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
