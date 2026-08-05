from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate publication figures from canonical results only.")
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    return parser.parse_args()


def save(fig, output_dir: Path, name: str) -> None:
    fig.tight_layout()
    fig.savefig(output_dir / f"{name}.svg", bbox_inches="tight")
    fig.savefig(output_dir / f"{name}.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def forecast_figure(canonical: dict, output_dir: Path) -> None:
    rows = [row for row in canonical["forecast"]["models"] if row["split"] == "test"]
    labels = [row["model"].replace("_", "\n") for row in rows]
    mae = np.array([row["mae_kw"] for row in rows], dtype=float)
    rmse = np.array([row["rmse_kw"] for row in rows], dtype=float)
    mae_std = np.array([row.get("mae_kw_std") or 0 for row in rows], dtype=float)
    rmse_std = np.array([row.get("rmse_kw_std") or 0 for row in rows], dtype=float)
    x = np.arange(len(labels))
    width = 0.36
    fig, ax = plt.subplots(figsize=(10, 5.2))
    ax.bar(x - width / 2, mae, width, yerr=mae_std, capsize=3, label="MAE", color="#2F6690")
    ax.bar(x + width / 2, rmse, width, yerr=rmse_std, capsize=3, label="RMSE", color="#F2A65A")
    ax.set_ylabel("Sai số (kW), mean ± sample SD")
    ax.set_xticks(x, labels)
    ax.set_title("Rolling-origin forecast evaluation on the canonical dataset")
    ax.grid(axis="y", alpha=0.25)
    ax.legend(frameon=False)
    save(fig, output_dir, "forecast_metrics_canonical")


def hardware_figure(canonical: dict, output_dir: Path) -> None:
    groups = canonical["hardware"].get("latencyGroups") or []
    fig, ax = plt.subplots(figsize=(9, 4.8))
    if groups:
        labels = [f"{row['network_label']}\n{row['endpoint']}" for row in groups]
        medians = [row["median_ms"] for row in groups]
        p95 = [row["p95_ms"] for row in groups]
        x = np.arange(len(labels))
        ax.bar(x - 0.18, medians, 0.36, label="Median", color="#2F6690")
        ax.bar(x + 0.18, p95, 0.36, label="p95", color="#F2A65A")
        ax.set_xticks(x, labels)
        ax.set_ylabel("Latency (ms)")
        ax.legend(frameon=False)
    else:
        ax.axis("off")
        ax.text(
            0.5, 0.55, "PENDING REAL-HARDWARE EVIDENCE", ha="center", va="center",
            fontsize=16, weight="bold", color="#9C6500",
        )
        ax.text(
            0.5, 0.42,
            "No accepted source=plc-s7-1200 and effectiveMode=plc-real trial group is available.",
            ha="center", va="center", fontsize=10,
        )
    ax.set_title("Hardware latency evidence status")
    save(fig, output_dir, "hardware_latency_canonical")


def main() -> int:
    args = parse_args()
    canonical = json.loads(args.canonical.read_text(encoding="utf-8"))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    forecast_figure(canonical, args.output_dir)
    hardware_figure(canonical, args.output_dir)
    print(args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
