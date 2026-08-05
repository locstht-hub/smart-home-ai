from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle


PALETTE = {
    "navy": "#234E70",
    "blue": "#2F6690",
    "light_blue": "#D9EAF7",
    "green": "#2A7F62",
    "light_green": "#DCEFE7",
    "orange": "#C56A1A",
    "light_orange": "#FBE8D3",
    "red": "#A33A3A",
    "light_red": "#F6DEDE",
    "gray": "#5B6573",
    "light_gray": "#EEF1F4",
    "dark": "#1F2933",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate figures for the Vietnamese paper revision.")
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    return parser.parse_args()


def configure_plotting() -> None:
    plt.rcParams.update(
        {
            "font.family": "serif",
            "font.serif": ["Times New Roman", "DejaVu Serif"],
            "font.size": 8.5,
            "axes.labelsize": 8.5,
            "xtick.labelsize": 8,
            "ytick.labelsize": 8,
            "legend.fontsize": 8,
            "svg.fonttype": "none",
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )


def save_figure(fig: plt.Figure, output_dir: Path, name: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_dir / f"{name}.svg", format="svg", bbox_inches="tight")
    fig.savefig(output_dir / f"{name}.png", format="png", dpi=600, bbox_inches="tight")
    fig.savefig(
        output_dir / f"{name}.tiff",
        format="tiff",
        dpi=600,
        pil_kwargs={"compression": "tiff_lzw"},
        bbox_inches="tight",
    )
    plt.close(fig)


def add_box(
    ax: plt.Axes,
    xy: tuple[float, float],
    width: float,
    height: float,
    title: str,
    detail: str,
    facecolor: str,
    edgecolor: str,
) -> None:
    x, y = xy
    patch = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle="round,pad=0.012,rounding_size=0.02",
        linewidth=1.0,
        facecolor=facecolor,
        edgecolor=edgecolor,
    )
    ax.add_patch(patch)
    ax.text(
        x + width / 2,
        y + height * 0.67,
        title,
        ha="center",
        va="center",
        weight="bold",
        color=PALETTE["dark"],
        fontsize=7.6,
        linespacing=1.05,
    )
    ax.text(
        x + width / 2,
        y + height * 0.29,
        detail,
        ha="center",
        va="center",
        color=PALETTE["dark"],
        fontsize=6.7,
        linespacing=1.05,
    )


def arrow(
    ax: plt.Axes,
    start: tuple[float, float],
    end: tuple[float, float],
    color: str,
    label: str = "",
    linestyle: str = "-",
    rad: float = 0.0,
) -> None:
    patch = FancyArrowPatch(
        start,
        end,
        arrowstyle="-|>",
        mutation_scale=10,
        linewidth=1.2,
        linestyle=linestyle,
        color=color,
        connectionstyle=f"arc3,rad={rad}",
    )
    ax.add_patch(patch)
    if label:
        mx = (start[0] + end[0]) / 2
        my = (start[1] + end[1]) / 2 + (0.02 if rad >= 0 else -0.02)
        ax.text(mx, my, label, ha="center", va="bottom", color=color, fontsize=7.3, backgroundcolor="white")


def architecture_figure(output_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(7.0, 4.2))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    ax.add_patch(Rectangle((0.02, 0.06), 0.96, 0.88, fill=False, linewidth=1.1, edgecolor=PALETTE["gray"]))
    ax.text(
        0.05,
        0.94,
        "Ranh giới hệ thống HEMS",
        va="center",
        weight="bold",
        color=PALETTE["gray"],
        fontsize=8,
        bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.5},
    )

    add_box(ax, (0.05, 0.68), 0.25, 0.16, "Ứng dụng di động /\nWeb quản trị", "phiên đăng nhập;\ntrạng thái thao tác", PALETTE["light_blue"], PALETTE["blue"])
    add_box(ax, (0.38, 0.68), 0.25, 0.16, "API biên", "xác thực; home scope;\nRBAC; audit log", PALETTE["light_green"], PALETTE["green"])
    add_box(ax, (0.70, 0.68), 0.25, 0.16, "Dịch vụ dự báo", "kiểm tra artifact;\ndự báo trực tiếp 24 giờ", PALETTE["light_orange"], PALETTE["orange"])
    add_box(ax, (0.21, 0.38), 0.27, 0.16, "PLC gateway đơn luồng", "tuần tự hóa I/O;\ntimeout phản hồi", PALETTE["light_gray"], PALETTE["gray"])
    add_box(ax, (0.56, 0.38), 0.27, 0.16, "Kho dữ liệu", "telemetry thật; cấu hình;\nfingerprint", PALETTE["light_gray"], PALETTE["gray"])
    add_box(ax, (0.11, 0.12), 0.28, 0.14, "PLC Siemens S7-1200", "command tag tách\nstatus tag", PALETTE["light_red"], PALETTE["red"])
    add_box(ax, (0.58, 0.12), 0.28, 0.14, "MFM384 và tải điện", "Modbus RTU/RS485;\nthử nghiệm thật đang chờ", PALETTE["light_red"], PALETTE["red"])

    arrow(ax, (0.30, 0.76), (0.38, 0.76), PALETTE["blue"], "REST/TLS")
    arrow(ax, (0.63, 0.76), (0.70, 0.76), PALETTE["orange"], "forecast API")
    arrow(ax, (0.47, 0.68), (0.38, 0.54), PALETTE["blue"], "lệnh đã cấp quyền")
    arrow(ax, (0.56, 0.68), (0.65, 0.54), PALETTE["green"], "đọc/ghi dữ liệu", linestyle="--")
    arrow(ax, (0.34, 0.38), (0.26, 0.26), PALETTE["blue"], "S7 write")
    arrow(ax, (0.22, 0.26), (0.34, 0.38), PALETTE["orange"], "status feedback", rad=-0.18)
    arrow(ax, (0.39, 0.19), (0.58, 0.19), PALETTE["green"], "đo điện", linestyle="--")
    arrow(ax, (0.72, 0.38), (0.82, 0.68), PALETTE["green"], "lịch sử", linestyle="--")
    arrow(ax, (0.83, 0.68), (0.73, 0.54), PALETTE["orange"], "kết quả 24 h")

    ax.plot([], [], color=PALETTE["blue"], label="luồng điều khiển")
    ax.plot([], [], color=PALETTE["orange"], label="luồng phản hồi/dự báo")
    ax.plot([], [], color=PALETTE["green"], linestyle="--", label="luồng telemetry/dữ liệu")
    ax.legend(loc="lower center", ncol=3, frameon=False, bbox_to_anchor=(0.5, -0.02))
    save_figure(fig, output_dir, "paper_architecture_vi")


def sequence_figure(output_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(7.0, 4.0))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    lanes = [(0.10, "Ứng dụng"), (0.36, "API + RBAC"), (0.63, "PLC gateway"), (0.89, "S7-1200 / statusTag")]
    for x, label in lanes:
        ax.add_patch(FancyBboxPatch((x - 0.095, 0.87), 0.19, 0.08, boxstyle="round,pad=0.01", facecolor=PALETTE["light_blue"], edgecolor=PALETTE["blue"], linewidth=0.9))
        ax.text(x, 0.91, label, ha="center", va="center", weight="bold")
        ax.plot([x, x], [0.16, 0.87], color="#AAB2BD", linewidth=0.8, linestyle="--")

    events = [
        (0.82, 0.10, 0.36, "1. POST lệnh + homeId", PALETTE["blue"]),
        (0.70, 0.36, 0.63, "2. scope hợp lệ; ghi audit", PALETTE["blue"]),
        (0.58, 0.63, 0.89, "3. read status; ghi command", PALETTE["blue"]),
        (0.46, 0.89, 0.63, "4. đọc statusTag độc lập", PALETTE["orange"]),
        (0.34, 0.63, 0.36, "5. verified / timeout / error", PALETTE["orange"]),
        (0.22, 0.36, 0.10, "6. kết quả có nguyên nhân", PALETTE["orange"]),
    ]
    for y, x1, x2, label, color in events:
        arrow(ax, (x1, y), (x2, y), color, label)

    ax.add_patch(FancyBboxPatch((0.02, 0.02), 0.96, 0.10, boxstyle="round,pad=0.012", facecolor=PALETTE["light_gray"], edgecolor=PALETTE["gray"], linewidth=0.8))
    states = [
        (0.12, "Đang xử lý", PALETTE["blue"]),
        (0.37, "Thành công khi\nfeedback khớp", PALETTE["green"]),
        (0.65, "Lỗi khi bị từ chối\nhoặc mất kết nối", PALETTE["red"]),
        (0.90, "Timeout khi feedback\nkhông khớp", PALETTE["orange"]),
    ]
    for x, label, color in states:
        ax.scatter([x], [0.07], s=28, color=color, edgecolor="black", linewidth=0.3, zorder=3)
        ax.text(x, 0.035, label, ha="center", va="center", fontsize=6.5, linespacing=1.0)
    save_figure(fig, output_dir, "paper_command_feedback_vi")


def evidence_figure(output_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(7.0, 3.8))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    lanes = [
        (0.69, "Hợp đồng phần mềm", "mã nguồn + test log", "ĐÃ KIỂM TRA", PALETTE["green"], PALETTE["light_green"]),
        (0.43, "Benchmark dữ liệu\ncông khai", "UCI + metrics + SHA-256", "ĐÃ KIỂM TRA", PALETTE["blue"], PALETTE["light_blue"]),
        (0.17, "Thử nghiệm\nPLC/MFM384 thật", "raw trial log +\nsource=plc-real", "ĐANG CHỜ", PALETTE["orange"], PALETTE["light_orange"]),
    ]
    for y, title, source, status, color, light in lanes:
        add_box(ax, (0.03, y), 0.25, 0.16, title, source, light, color)
        add_box(ax, (0.38, y), 0.22, 0.16, "Evidence gate", status, light, color)
        add_box(ax, (0.70, y), 0.27, 0.16, "Quyền công bố", "claim được mở hoặc\ngiữ ở hạn chế", light, color)
        arrow(ax, (0.28, y + 0.08), (0.38, y + 0.08), color)
        arrow(ax, (0.60, y + 0.08), (0.70, y + 0.08), color)

    ax.text(0.5, 0.94, "Nguồn số liệu duy nhất: canonical_results.json", ha="center", va="center", weight="bold", color=PALETTE["dark"])
    ax.text(0.5, 0.07, "Chỉ claim có nguồn, số mẫu và fingerprint phù hợp mới được đưa vào Results.", ha="center", va="center", color=PALETTE["gray"])
    save_figure(fig, output_dir, "paper_evidence_gate_vi")


def horizon_figure(canonical: dict, output_dir: Path) -> None:
    test_rows = {row["model"]: row for row in canonical["forecast"]["models"] if row.get("split") == "test"}
    horizons = [1, 6, 12, 24]
    keys = ["h_plus_1", "h_plus_6", "h_plus_12", "h_plus_24"]
    series = [
        ("XGBoost", "xgboost", PALETTE["blue"], "o", "-"),
        ("Random Forest", "random_forest", PALETTE["green"], "s", "--"),
        ("Seasonal naive 24 h", "seasonal_naive_24h", PALETTE["gray"], "^", ":"),
    ]

    fig, axes = plt.subplots(1, 2, figsize=(7.0, 3.1), sharex=True)
    for ax, metric, ylabel in zip(axes, ["horizon_mae", "horizon_rmse"], ["MAE (kW)", "RMSE (kW)"]):
        for label, key, color, marker, linestyle in series:
            row = test_rows[key]
            values = [row[metric][h] for h in keys]
            errors = [row[metric].get(f"{h}_std", 0.0) for h in keys]
            ax.errorbar(
                horizons,
                values,
                yerr=errors,
                label=label,
                color=color,
                marker=marker,
                linestyle=linestyle,
                linewidth=1.2,
                markersize=4,
                capsize=2.5,
            )
        ax.set_xlabel("Horizon dự báo (giờ)")
        ax.set_ylabel(ylabel)
        ax.set_xticks(horizons)
        ax.grid(axis="y", color="#D7DCE2", linewidth=0.6)
        ax.set_ylim(bottom=0)
    axes[0].legend(frameon=False, loc="upper left")
    fig.subplots_adjust(wspace=0.28)
    save_figure(fig, output_dir, "paper_forecast_horizon_vi")


def main() -> int:
    args = parse_args()
    canonical = json.loads(args.canonical.read_text(encoding="utf-8"))
    configure_plotting()
    architecture_figure(args.output_dir)
    sequence_figure(args.output_dir)
    evidence_figure(args.output_dir)
    horizon_figure(canonical, args.output_dir)
    print(args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
