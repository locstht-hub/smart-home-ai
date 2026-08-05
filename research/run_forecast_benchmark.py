from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import statistics
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
TRAIN_SCRIPT = ROOT / "ml-training" / "forecast-24h-colab" / "train_24h_forecast.py"
SPEC = importlib.util.spec_from_file_location("train_24h_forecast", TRAIN_SCRIPT)
assert SPEC and SPEC.loader
FORECAST = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(FORECAST)

METRIC_KEYS = ("mae", "rmse", "mape", "r2", "inference_ms_per_sample")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run repeated rolling-origin load-forecast evaluation.")
    parser.add_argument("--data-source", choices=("uci", "local_csv"), default="uci")
    parser.add_argument("--uci-data-path", default="")
    parser.add_argument("--csv-path", default="")
    parser.add_argument("--timestamp-col", default="timestamp")
    parser.add_argument("--power-col", default="power_kw")
    parser.add_argument("--dataset-label", default="")
    parser.add_argument("--max-history-days", type=int, default=730)
    parser.add_argument("--min-local-days", type=int, default=30)
    parser.add_argument("--folds", type=int, default=3)
    parser.add_argument("--seeds", default="42,3407,2026")
    parser.add_argument("--rf-n-estimators", type=int, default=25)
    parser.add_argument("--xgb-n-estimators", type=int, default=75)
    parser.add_argument("--output-dir", type=Path, default=Path("research/results/benchmark_latest"))
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rolling_splits(X: pd.DataFrame, y: pd.DataFrame, timestamps: pd.Series, folds: int):
    if folds < 2:
        raise ValueError("At least two rolling-origin folds are required")
    total = len(X)
    initial_train = int(total * 0.55)
    remaining = total - initial_train
    window = remaining // (folds + 1)
    if window < 48:
        raise ValueError("Not enough rows for rolling-origin validation")
    splits = []
    for index in range(folds):
        train_end = initial_train + index * window
        val_end = train_end + window
        test_end = val_end + window
        splits.append(
            {
                "train": (X.iloc[:train_end], y.iloc[:train_end], timestamps.iloc[:train_end]),
                "val": (X.iloc[train_end:val_end], y.iloc[train_end:val_end], timestamps.iloc[train_end:val_end]),
                "test": (X.iloc[val_end:test_end], y.iloc[val_end:test_end], timestamps.iloc[val_end:test_end]),
            }
        )
    return splits


def aggregate(runs: list[dict[str, Any]], split: str) -> dict[str, Any]:
    selected = [run[split] for run in runs]
    result: dict[str, Any] = {}
    for key in METRIC_KEYS:
        values = [float(item[key]) for item in selected]
        result[key] = statistics.fmean(values)
        result[f"{key}_std"] = statistics.stdev(values) if len(values) > 1 else 0.0
    for horizon_key in ("horizon_mae", "horizon_rmse"):
        result[horizon_key] = {}
        for horizon in ("h_plus_1", "h_plus_6", "h_plus_12", "h_plus_24"):
            values = [float(item[horizon_key][horizon]) for item in selected]
            result[horizon_key][horizon] = statistics.fmean(values)
            result[horizon_key][f"{horizon}_std"] = statistics.stdev(values) if len(values) > 1 else 0.0
    return result


def main() -> int:
    args = parse_args()
    seeds = [int(value.strip()) for value in args.seeds.split(",") if value.strip()]
    if args.folds < 3:
        raise ValueError("Provide at least three rolling-origin folds for canonical evaluation")
    if len(seeds) < 3:
        raise ValueError("Provide at least three seeds for repeated evaluation")

    if args.data_source == "uci":
        raw = FORECAST.load_uci_dataset(args.uci_data_path)
        dataset_name = "UCI Individual Household Electric Power Consumption"
        source_path = Path(args.uci_data_path) if args.uci_data_path else None
    else:
        raw = FORECAST.load_local_csv(args.csv_path, args.timestamp_col, args.power_col)
        duration_days = (raw["timestamp"].max() - raw["timestamp"].min()).total_seconds() / 86400
        if duration_days < args.min_local_days:
            raise ValueError(f"Local dataset covers {duration_days:.1f} days; need {args.min_local_days}")
        dataset_name = args.dataset_label.strip() or "Local PLC/MFM384 CSV"
        source_path = Path(args.csv_path)

    source_raw_rows = len(raw)
    source_power_missing_rows = int(raw[FORECAST.TARGET_COLUMN].isna().sum())
    raw = FORECAST.trim_recent_history(raw, args.max_history_days)
    trimmed_power_missing_rows = int(raw[FORECAST.TARGET_COLUMN].isna().sum())
    hourly = FORECAST.resample_to_hourly(raw)
    X, y, timestamps = FORECAST.build_supervised_dataset(hourly)
    folds = rolling_splits(X, y, timestamps, args.folds)
    runs: dict[str, list[dict[str, Any]]] = {
        "persistence": [],
        "seasonal_naive_24h": [],
        "seasonal_naive_168h": [],
        "random_forest": [],
        "xgboost": [],
    }

    for fold_index, split in enumerate(folds, start=1):
        X_train, y_train, _ = split["train"]
        X_val, y_val, _ = split["val"]
        X_test, y_test, _ = split["test"]
        for name, period in (("persistence", 0), ("seasonal_naive_24h", 24), ("seasonal_naive_168h", 168)):
            evaluator = FORECAST.evaluate_persistence if period == 0 else lambda a, b, p=period: FORECAST.evaluate_seasonal_naive(a, b, p)
            runs[name].append({
                "fold": fold_index,
                "seed": None,
                "validation": evaluator(X_val, y_val),
                "test": evaluator(X_test, y_test),
            })
        for model_name in ("random_forest", "xgboost"):
            for seed in seeds:
                bundle = FORECAST.fit_direct_models(
                    model_name,
                    X_train,
                    y_train,
                    X_val,
                    y_val,
                    random_state=seed,
                    n_estimators_override=(
                        args.rf_n_estimators if model_name == "random_forest" else args.xgb_n_estimators
                    ),
                )
                runs[model_name].append({
                    "fold": fold_index,
                    "seed": seed,
                    "validation": FORECAST.evaluate_model(bundle, X_val, y_val),
                    "test": FORECAST.evaluate_model(bundle, X_test, y_test),
                })

    results = {
        name: {
            "validation": aggregate(model_runs, "validation"),
            "test": aggregate(model_runs, "test"),
            "runs": model_runs,
        }
        for name, model_runs in runs.items()
    }
    learned_models = ("random_forest", "xgboost")
    best_model = min(learned_models, key=lambda name: results[name]["validation"]["mae"])
    fold_ranges = [
        {
            name: {
                "rows": len(part[0]),
                "start": str(pd.to_datetime(part[2].iloc[0])),
                "end": str(pd.to_datetime(part[2].iloc[-1])),
            }
            for name, part in fold.items()
        }
        for fold in folds
    ]
    payload = {
        "schemaVersion": 2,
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "dataset_summary": {
            "dataset_name": dataset_name,
            "data_source": args.data_source,
            "dataset_sha256": sha256_file(source_path) if source_path and source_path.exists() else None,
            "source_period_start": str(pd.to_datetime(raw["timestamp"].min())),
            "source_period_end": str(pd.to_datetime(raw["timestamp"].max())),
            "max_history_days": args.max_history_days,
            "source_raw_rows": source_raw_rows,
            "source_power_missing_rows": source_power_missing_rows,
            "source_power_missing_percent": (100.0 * source_power_missing_rows / max(1, source_raw_rows)),
            "raw_rows": len(raw),
            "trimmed_power_missing_rows": trimmed_power_missing_rows,
            "trimmed_power_missing_percent": (100.0 * trimmed_power_missing_rows / max(1, len(raw))),
            "hourly_rows": len(hourly),
            "hourly_period_start": str(pd.to_datetime(hourly["timestamp"].min())),
            "hourly_period_end": str(pd.to_datetime(hourly["timestamp"].max())),
            "supervised_rows": len(X),
            "preprocessing": {
                "causal_fill_method": "past_only_forward_fill",
                "causal_fill_limit_hours": FORECAST.CAUSAL_FILL_LIMIT_HOURS,
                "hourly_power_rows_not_observed": int((~hourly[FORECAST.TARGET_OBSERVED_COLUMN]).sum()),
                "hourly_power_rows_causally_filled": int(
                    ((~hourly[FORECAST.TARGET_OBSERVED_COLUMN]) & hourly[FORECAST.TARGET_COLUMN].notna()).sum()
                ),
                "imputed_power_allowed_as_target": False,
            },
            "split_strategy": "expanding_rolling_origin",
            "rolling_folds": args.folds,
            "fold_ranges": fold_ranges,
            "random_seeds": seeds,
            "mape_denominator_floor_kw": FORECAST.MAPE_DENOMINATOR_FLOOR_KW,
            "model_config": {
                "random_forest": {"n_estimators": args.rf_n_estimators, "max_depth": 12},
                "xgboost": {
                    "n_estimators": args.xgb_n_estimators,
                    "max_depth": 5,
                    "learning_rate": 0.035,
                },
                "direct_horizons": FORECAST.FORECAST_HORIZON_HOURS,
            },
        },
        "best_model": best_model,
        "selection_metric": "validation_mae_mean",
        "results": results,
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / "metrics.json"
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output)
    print(json.dumps({"best_model": best_model, "test": results[best_model]["test"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
