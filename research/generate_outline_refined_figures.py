from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.path import Path as MplPath
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle
from matplotlib.ticker import MultipleLocator


PALETTE = {
    "blue": "#0072B2",
    "green": "#009E73",
    "orange": "#D55E00",
    "purple": "#8C6BB1",
    "gray": "#626B75",
    "dark": "#263238",
    "line": "#CBD3DA",
    "band": "#F7F9FA",
    "blue_fill": "#E6F2F8",
    "green_fill": "#E7F5EF",
    "orange_fill": "#FCEDE5",
    "gray_fill": "#F0F3F5",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate refined vector figures for the reduced CTUT paper outline."
    )
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    return parser.parse_args()


def configure() -> None:
    plt.rcParams.update(
        {
            "font.family": "serif",
            "font.serif": ["Times New Roman", "DejaVu Serif"],
            "font.size": 8.5,
            "axes.labelsize": 9.0,
            "axes.titlesize": 9.5,
            "xtick.labelsize": 8.2,
            "ytick.labelsize": 8.2,
            "legend.fontsize": 7.7,
            "axes.linewidth": 0.8,
            "svg.fonttype": "none",
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )


def save_figure(fig: plt.Figure, output_dir: Path, name: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for suffix, kwargs in (
        ("svg", {"format": "svg"}),
        ("png", {"format": "png", "dpi": 600}),
        (
            "tiff",
            {
                "format": "tiff",
                "dpi": 600,
                "pil_kwargs": {"compression": "tiff_lzw"},
            },
        ),
    ):
        fig.savefig(
            output_dir / f"{name}.{suffix}",
            bbox_inches="tight",
            facecolor="white",
            **kwargs,
        )
    plt.close(fig)


def add_band(
    ax: plt.Axes,
    y: float,
    height: float,
    label: str,
) -> None:
    ax.add_patch(
        Rectangle(
            (0.02, y),
            0.96,
            height,
            facecolor=PALETTE["band"],
            edgecolor=PALETTE["line"],
            linewidth=0.8,
            zorder=0,
        )
    )
    ax.text(
        0.035,
        y + height - 0.018,
        label,
        ha="left",
        va="top",
        fontsize=7.4,
        weight="bold",
        color=PALETTE["gray"],
    )


def add_box(
    ax: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    detail: str,
    *,
    facecolor: str,
    edgecolor: str,
) -> None:
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            width,
            height,
            boxstyle="round,pad=0.010,rounding_size=0.015",
            facecolor=facecolor,
            edgecolor=edgecolor,
            linewidth=1.1,
            zorder=3,
        )
    )
    ax.text(
        x + width / 2,
        y + height * 0.64,
        title,
        ha="center",
        va="center",
        fontsize=8.8,
        weight="bold",
        color=PALETTE["dark"],
        zorder=4,
    )
    ax.text(
        x + width / 2,
        y + height * 0.28,
        detail,
        ha="center",
        va="center",
        fontsize=7.6,
        color=PALETTE["dark"],
        linespacing=1.05,
        zorder=4,
    )


def add_arrow(
    ax: plt.Axes,
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    color: str,
    label: str,
    linestyle: str = "-",
    curve: float = 0.0,
    label_xy: tuple[float, float] | None = None,
    zorder: int = 2,
) -> None:
    ax.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle="-|>",
            mutation_scale=9,
            linewidth=1.25,
            linestyle=linestyle,
            color=color,
            connectionstyle=f"arc3,rad={curve}",
            zorder=zorder,
        )
    )
    if label:
        x, y = label_xy or (
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 + 0.018,
        )
        ax.text(
            x,
            y,
            label,
            ha="center",
            va="center",
            fontsize=7.3,
            color=color,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 0.8},
            zorder=5,
        )


def add_path_arrow(
    ax: plt.Axes,
    vertices: list[tuple[float, float]],
    *,
    color: str,
    linestyle: str = "-",
) -> None:
    path = MplPath(
        vertices,
        [MplPath.MOVETO] + [MplPath.LINETO] * (len(vertices) - 1),
    )
    ax.add_patch(
        FancyArrowPatch(
            path=path,
            arrowstyle="-|>",
            mutation_scale=9,
            linewidth=1.25,
            linestyle=linestyle,
            color=color,
            zorder=2,
        )
    )


def architecture_figure(output_dir: Path) -> None:
    fig, ax = plt.subplots(figsize=(7.2, 3.75))
    ax.set(xlim=(0, 1), ylim=(0, 1))
    ax.axis("off")

    add_band(ax, 0.68, 0.28, "LỚP THIẾT BỊ ĐIỆN")
    add_band(ax, 0.36, 0.27, "LỚP TÍCH HỢP VÀ DỮ LIỆU")
    add_band(ax, 0.08, 0.23, "LỚP VẬN HÀNH")

    add_box(
        ax,
        0.07,
        0.745,
        0.24,
        0.14,
        "Đồng hồ MFM384",
        "V, I, P, E\nRS-485",
        facecolor=PALETTE["green_fill"],
        edgecolor=PALETTE["green"],
    )
    add_box(
        ax,
        0.38,
        0.745,
        0.24,
        0.14,
        "PLC S7-1200",
        "I/O · liên động\ntrạng thái",
        facecolor=PALETTE["blue_fill"],
        edgecolor=PALETTE["blue"],
    )
    add_box(
        ax,
        0.69,
        0.745,
        0.24,
        0.14,
        "Contactor + phụ tải",
        "đóng/cắt\nphản hồi tiếp điểm",
        facecolor=PALETTE["orange_fill"],
        edgecolor=PALETTE["orange"],
    )

    add_box(
        ax,
        0.07,
        0.425,
        0.24,
        0.135,
        "Kho dữ liệu",
        "lịch sử đo · quota\nsự kiện",
        facecolor=PALETTE["green_fill"],
        edgecolor=PALETTE["green"],
    )
    add_box(
        ax,
        0.38,
        0.425,
        0.24,
        0.135,
        "Gateway PLC/API",
        "polling · timeout\nxác nhận",
        facecolor=PALETTE["blue_fill"],
        edgecolor=PALETTE["blue"],
    )
    add_box(
        ax,
        0.69,
        0.425,
        0.24,
        0.135,
        "Dự báo và khuyến nghị",
        "h+1 … h+24\nngưỡng quota",
        facecolor=PALETTE["orange_fill"],
        edgecolor=PALETTE["orange"],
    )
    add_box(
        ax,
        0.30,
        0.135,
        0.40,
        0.115,
        "Web Dashboard / ứng dụng di động",
        "giám sát · cảnh báo · yêu cầu điều khiển",
        facecolor=PALETTE["gray_fill"],
        edgecolor=PALETTE["gray"],
    )

    add_arrow(
        ax,
        (0.31, 0.815),
        (0.38, 0.815),
        color=PALETTE["green"],
        label="Modbus RTU",
        linestyle="--",
        label_xy=(0.345, 0.845),
    )
    add_arrow(
        ax,
        (0.62, 0.835),
        (0.69, 0.835),
        color=PALETTE["blue"],
        label="lệnh đóng/cắt",
        label_xy=(0.655, 0.865),
    )
    add_arrow(
        ax,
        (0.69, 0.785),
        (0.62, 0.785),
        color=PALETTE["orange"],
        label="phản hồi",
        label_xy=(0.655, 0.755),
    )
    add_arrow(
        ax,
        (0.47, 0.745),
        (0.47, 0.56),
        color=PALETTE["green"],
        label="trạng thái",
        linestyle="--",
        label_xy=(0.415, 0.650),
    )
    add_arrow(
        ax,
        (0.53, 0.56),
        (0.53, 0.745),
        color=PALETTE["blue"],
        label="lệnh PLC",
        label_xy=(0.575, 0.650),
    )
    add_arrow(
        ax,
        (0.38, 0.492),
        (0.31, 0.492),
        color=PALETTE["green"],
        label="dữ liệu đo",
        linestyle="--",
        label_xy=(0.345, 0.522),
    )
    add_path_arrow(
        ax,
        [(0.19, 0.425), (0.19, 0.385), (0.81, 0.385), (0.81, 0.425)],
        color=PALETTE["green"],
        linestyle="--",
    )
    ax.text(
        0.50,
        0.385,
        "lịch sử đo",
        ha="center",
        va="center",
        fontsize=7.3,
        color=PALETTE["green"],
        bbox={"facecolor": "white", "edgecolor": "none", "pad": 0.8},
        zorder=5,
    )
    add_arrow(
        ax,
        (0.76, 0.425),
        (0.64, 0.25),
        color=PALETTE["orange"],
        label="dự báo / khuyến nghị",
        label_xy=(0.735, 0.330),
    )
    add_arrow(
        ax,
        (0.18, 0.425),
        (0.36, 0.25),
        color=PALETTE["green"],
        label="giám sát / quota",
        linestyle="--",
        label_xy=(0.235, 0.330),
    )
    add_arrow(
        ax,
        (0.50, 0.25),
        (0.50, 0.425),
        color=PALETTE["blue"],
        label="yêu cầu điều khiển",
        label_xy=(0.500, 0.285),
    )

    ax.plot(
        [0.16, 0.20],
        [0.035, 0.035],
        color=PALETTE["blue"],
        linewidth=1.4,
        clip_on=False,
    )
    ax.text(0.205, 0.035, "điều khiển", va="center", fontsize=7.3)
    ax.plot(
        [0.43, 0.47],
        [0.035, 0.035],
        color=PALETTE["orange"],
        linewidth=1.4,
        clip_on=False,
    )
    ax.text(0.475, 0.035, "phản hồi / dự báo", va="center", fontsize=7.3)
    ax.plot(
        [0.73, 0.77],
        [0.035, 0.035],
        color=PALETTE["green"],
        linewidth=1.4,
        linestyle="--",
        clip_on=False,
    )
    ax.text(0.775, 0.035, "dữ liệu / giám sát", va="center", fontsize=7.3)

    save_figure(fig, output_dir, "final_architecture_vi")


def forecast_figure(canonical: dict, output_dir: Path) -> None:
    rows = {
        row["model"]: row
        for row in canonical["forecast"]["models"]
        if row.get("split") == "test"
    }
    horizons = [1, 6, 12, 24]
    horizon_keys = ["h_plus_1", "h_plus_6", "h_plus_12", "h_plus_24"]
    series = [
        ("XGBoost", "xgboost", PALETTE["blue"], "o", "-", 1.9),
        ("Random Forest", "random_forest", PALETTE["green"], "s", "--", 1.7),
        ("Persistence", "persistence", PALETTE["orange"], "D", "-.", 1.15),
        ("Naive mùa vụ 24 giờ", "seasonal_naive_24h", "#5F6872", "^", ":", 1.15),
        ("Naive mùa vụ 168 giờ", "seasonal_naive_168h", PALETTE["purple"], "v", (0, (4, 1.5)), 1.15),
    ]

    fig, axes = plt.subplots(1, 2, figsize=(5.75, 2.80), sharex=True)
    panels = [
        (axes[0], "horizon_mae", "MAE (kW)", "(a) MAE", (0.20, 1.04), 0.20),
        (axes[1], "horizon_rmse", "RMSE (kW)", "(b) RMSE", (0.35, 1.25), 0.20),
    ]
    for ax, metric, ylabel, title, limits, tick_step in panels:
        for label, key, color, marker, linestyle, width in series:
            row = rows[key]
            values = [row[metric][h] for h in horizon_keys]
            errors = [row[metric].get(f"{h}_std", 0.0) for h in horizon_keys]
            ax.errorbar(
                horizons,
                values,
                yerr=errors,
                label=label,
                color=color,
                marker=marker,
                linestyle=linestyle,
                linewidth=width,
                markersize=4.5 if key in {"xgboost", "random_forest"} else 3.8,
                markeredgewidth=0.6,
                capsize=2.2,
                elinewidth=0.85,
                alpha=0.98,
                zorder=4 if key in {"xgboost", "random_forest"} else 3,
            )
        ax.set_title(title, loc="left", weight="bold", pad=5)
        ax.set_ylabel(ylabel)
        ax.set_xticks(horizons)
        ax.set_xlim(0, 25)
        ax.set_ylim(*limits)
        ax.yaxis.set_major_locator(MultipleLocator(tick_step))
        ax.grid(axis="y", color=PALETTE["line"], linewidth=0.55, alpha=0.85)
        ax.tick_params(direction="out", length=3, width=0.8)
        ax.text(
            0.98,
            0.97,
            "Thấp hơn là tốt hơn",
            transform=ax.transAxes,
            ha="right",
            va="top",
            fontsize=7.0,
            color=PALETTE["gray"],
        )

    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(
        handles,
        labels,
        loc="upper center",
        ncol=3,
        frameon=False,
        bbox_to_anchor=(0.5, 0.995),
        columnspacing=1.2,
        handlelength=2.6,
        handletextpad=0.5,
    )
    fig.supxlabel("Chân trời dự báo (giờ)", y=0.10, fontsize=9.0)
    fig.text(
        0.5,
        0.025,
        "Thanh sai số: độ lệch chuẩn mẫu; n = 9 với XGBoost/Random Forest và n = 3 với các baseline.",
        ha="center",
        va="bottom",
        fontsize=7.2,
        color=PALETTE["gray"],
    )
    fig.subplots_adjust(left=0.085, right=0.985, bottom=0.22, top=0.78, wspace=0.27)
    save_figure(fig, output_dir, "final_forecast_horizon_vi")


def main() -> int:
    args = parse_args()
    if not args.canonical.is_file():
        raise FileNotFoundError(args.canonical)
    canonical = json.loads(args.canonical.read_text(encoding="utf-8"))
    configure()
    architecture_figure(args.output_dir)
    forecast_figure(canonical, args.output_dir)
    print(args.output_dir.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
