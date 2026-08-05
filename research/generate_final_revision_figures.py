from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle


COLORS = {
    "navy": "#234E70",
    "blue": "#2F6690",
    "green": "#2A7F62",
    "orange": "#C56A1A",
    "red": "#A33A3A",
    "purple": "#6B4C9A",
    "gray": "#5B6573",
    "black": "#1F2933",
    "light_blue": "#D9EAF7",
    "light_green": "#DCEFE7",
    "light_orange": "#FBE8D3",
    "light_red": "#F6DEDE",
    "light_gray": "#EEF1F4",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate three final-revision paper figures.")
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    return parser.parse_args()


def configure() -> None:
    plt.rcParams.update(
        {
            "font.family": "serif",
            "font.serif": ["Times New Roman", "DejaVu Serif"],
            "font.size": 9.5,
            "axes.labelsize": 9.5,
            "axes.titlesize": 10,
            "xtick.labelsize": 9,
            "ytick.labelsize": 9,
            "legend.fontsize": 8.4,
            "svg.fonttype": "none",
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )


def save(fig: plt.Figure, output_dir: Path, name: str) -> None:
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


def box(
    ax: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    detail: str,
    face: str,
    edge: str,
) -> None:
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            width,
            height,
            boxstyle="round,pad=0.012,rounding_size=0.018",
            linewidth=1.1,
            facecolor=face,
            edgecolor=edge,
        )
    )
    ax.text(x + width / 2, y + height * 0.68, title, ha="center", va="center", weight="bold", fontsize=9.2)
    ax.text(x + width / 2, y + height * 0.29, detail, ha="center", va="center", fontsize=8.5, linespacing=1.05)


def arrow(
    ax: plt.Axes,
    start: tuple[float, float],
    end: tuple[float, float],
    color: str,
    label: str = "",
    *,
    linestyle: str = "-",
    rad: float = 0.0,
    label_offset: float = 0.018,
) -> None:
    ax.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle="-|>",
            mutation_scale=10,
            linewidth=1.25,
            linestyle=linestyle,
            color=color,
            connectionstyle=f"arc3,rad={rad}",
        )
    )
    if label:
        ax.text(
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 + label_offset,
            label,
            ha="center",
            va="bottom",
            color=color,
            fontsize=8.2,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 0.5},
        )


def architecture(output_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(7.2, 4.15))
    ax.set(xlim=(0, 1), ylim=(0, 1))
    ax.axis("off")
    ax.text(0.04, 0.96, "Chuỗi đo lường, điều khiển và quản lý phụ tải", va="center", weight="bold", color=COLORS["gray"])
    ax.add_patch(Rectangle((0.02, 0.07), 0.96, 0.85, fill=False, linewidth=1.1, edgecolor=COLORS["gray"]))

    box(ax, 0.04, 0.69, 0.23, 0.16, "Đồng hồ MFM384", "V, I, P, E\nchờ raw log thiết bị", COLORS["light_red"], COLORS["red"])
    box(ax, 0.385, 0.69, 0.23, 0.16, "PLC Siemens S7-1200", "thu thập; interlock\ncommandTag / statusTag", COLORS["light_blue"], COLORS["blue"])
    box(ax, 0.73, 0.69, 0.23, 0.16, "Relay/contactor và tải", "đóng cắt; tiếp điểm phản hồi\nchưa thử tải thật", COLORS["light_red"], COLORS["red"])

    box(ax, 0.385, 0.40, 0.23, 0.15, "Cổng truyền thông PLC", "tuần tự I/O\npolling; timeout", COLORS["light_gray"], COLORS["gray"])
    box(ax, 0.04, 0.14, 0.23, 0.15, "Kho dữ liệu điện", "lịch sử V/I/P/E\nđiện năng và quota", COLORS["light_green"], COLORS["green"])
    box(ax, 0.385, 0.14, 0.23, 0.15, "Mô-đun dự báo", "benchmark UCI đã kiểm\nh+1…h+24", COLORS["light_orange"], COLORS["orange"])
    box(ax, 0.73, 0.14, 0.23, 0.15, "Web / ứng dụng di động", "giám sát; cảnh báo\nkhuyến nghị; yêu cầu lệnh", COLORS["light_green"], COLORS["green"])

    arrow(ax, (0.27, 0.875), (0.385, 0.875), COLORS["green"], "Modbus RTU", linestyle="--", label_offset=0.005)
    arrow(ax, (0.615, 0.875), (0.73, 0.875), COLORS["blue"], "lệnh đóng/cắt", label_offset=0.005)
    arrow(ax, (0.73, 0.66), (0.615, 0.66), COLORS["orange"], "tiếp điểm phản hồi", label_offset=-0.040)
    arrow(ax, (0.50, 0.69), (0.50, 0.55), COLORS["blue"], "I/O và trạng thái")
    arrow(ax, (0.45, 0.55), (0.27, 0.29), COLORS["green"], "dữ liệu đo", linestyle="--")
    arrow(ax, (0.27, 0.215), (0.385, 0.215), COLORS["green"], "lịch sử")
    arrow(ax, (0.615, 0.215), (0.73, 0.215), COLORS["orange"], "dự báo 24 giờ")
    arrow(ax, (0.27, 0.13), (0.73, 0.13), COLORS["green"], "giám sát / quota", linestyle="--", rad=-0.12, label_offset=-0.045)
    arrow(ax, (0.73, 0.36), (0.615, 0.47), COLORS["blue"], "yêu cầu lệnh", label_offset=0.005)
    arrow(ax, (0.615, 0.42), (0.73, 0.30), COLORS["orange"], "kết quả", label_offset=-0.025)

    ax.plot([], [], color=COLORS["blue"], label="đường điều khiển")
    ax.plot([], [], color=COLORS["orange"], label="phản hồi / dự báo")
    ax.plot([], [], color=COLORS["green"], linestyle="--", label="dữ liệu đo / giám sát")
    ax.legend(loc="lower center", ncol=3, frameon=False, bbox_to_anchor=(0.5, -0.02))
    save(fig, output_dir, "final_architecture_vi")


def command_feedback(output_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(7.2, 4.35))
    ax.set(xlim=(0, 1), ylim=(0, 1))
    ax.axis("off")
    lanes = [(0.09, "Vận hành"), (0.34, "Kiểm tra lệnh"), (0.62, "PLC gateway"), (0.90, "S7-1200 / statusTag")]
    for x, label in lanes:
        ax.add_patch(FancyBboxPatch((x - 0.09, 0.88), 0.18, 0.075, boxstyle="round,pad=0.01", facecolor=COLORS["light_blue"], edgecolor=COLORS["blue"], linewidth=0.9))
        ax.text(x, 0.917, label, ha="center", va="center", weight="bold", fontsize=8.8)
        ax.plot([x, x], [0.19, 0.88], color="#AAB2BD", linewidth=0.8, linestyle="--")

    arrow(ax, (0.09, 0.82), (0.34, 0.82), COLORS["blue"], "1. trạng thái yêu cầu")
    arrow(ax, (0.34, 0.72), (0.62, 0.72), COLORS["blue"], "2. quyền/quota/liên động hợp lệ")
    arrow(ax, (0.62, 0.62), (0.90, 0.62), COLORS["blue"], "3. đọc status; phát xung khi cần")
    arrow(ax, (0.90, 0.51), (0.62, 0.51), COLORS["orange"], "4. đọc statusTag độc lập")
    arrow(ax, (0.65, 0.45), (0.87, 0.45), COLORS["orange"], "poll đến khi khớp / hết hạn", rad=0.35)
    arrow(ax, (0.87, 0.41), (0.65, 0.41), COLORS["orange"], "vòng lặp polling", rad=0.35, label_offset=-0.060)
    arrow(ax, (0.62, 0.32), (0.34, 0.32), COLORS["orange"], "5. verified / denied / error / timeout")
    arrow(ax, (0.34, 0.23), (0.09, 0.23), COLORS["orange"], "6. kết quả có nguyên nhân")

    state_y = 0.09
    states = [
        (0.10, "Đang xử lý", COLORS["blue"]),
        (0.36, "Thành công\nkhi feedback khớp", COLORS["green"]),
        (0.64, "Lỗi / bị từ chối", COLORS["red"]),
        (0.89, "Timeout phản hồi", COLORS["orange"]),
    ]
    for x, label, color in states:
        ax.scatter([x], [state_y + 0.025], s=34, color=color, edgecolor="black", linewidth=0.3, zorder=3)
        ax.text(x, state_y - 0.015, label, ha="center", va="top", fontsize=8.3, linespacing=1.05)
    save(fig, output_dir, "final_command_feedback_vi")


def forecast(canonical: dict, output_dir: Path) -> None:
    rows = {row["model"]: row for row in canonical["forecast"]["models"] if row.get("split") == "test"}
    horizons = [1, 6, 12, 24]
    horizon_keys = ["h_plus_1", "h_plus_6", "h_plus_12", "h_plus_24"]
    series = [
        ("XGBoost", "xgboost", COLORS["blue"], "o", "-"),
        ("Random Forest", "random_forest", COLORS["green"], "s", "--"),
        ("Persistence", "persistence", COLORS["red"], "D", "-."),
        ("Seasonal naive 24 h", "seasonal_naive_24h", COLORS["gray"], "^", ":"),
        ("Seasonal naive 168 h", "seasonal_naive_168h", COLORS["purple"], "v", (0, (3, 1, 1, 1))),
    ]
    fig, axes = plt.subplots(1, 2, figsize=(7.2, 3.65), sharex=True)
    for panel, (ax, metric, ylabel) in enumerate(
        zip(axes, ["horizon_mae", "horizon_rmse"], ["MAE (kW)", "RMSE (kW)"]),
        start=1,
    ):
        for label, key, color, marker, linestyle in series:
            row = rows[key]
            values = [row[metric][h] for h in horizon_keys]
            errors = [row[metric].get(f"{h}_std", 0.0) for h in horizon_keys]
            ax.errorbar(
                horizons,
                values,
                yerr=errors,
                label=f"{label} (n={row['run_count']})",
                color=color,
                marker=marker,
                linestyle=linestyle,
                linewidth=1.25,
                markersize=4.2,
                capsize=2.5,
            )
        ax.set_title("(a) MAE" if panel == 1 else "(b) RMSE", loc="left", weight="bold")
        ax.set_xlabel("Chân trời dự báo (giờ)")
        ax.set_ylabel(ylabel)
        ax.set_xticks(horizons)
        ax.set_ylim(bottom=0)
        ax.grid(axis="y", color="#D7DCE2", linewidth=0.6)
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=2, frameon=False, bbox_to_anchor=(0.5, -0.03))
    fig.subplots_adjust(wspace=0.30, bottom=0.29)
    save(fig, output_dir, "final_forecast_horizon_vi")


def main() -> int:
    args = parse_args()
    canonical = json.loads(args.canonical.read_text(encoding="utf-8"))
    configure()
    architecture(args.output_dir)
    command_feedback(args.output_dir)
    forecast(canonical, args.output_dir)
    print(args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
