from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

import pandas as pd


SCRIPT = Path(__file__).resolve().parents[2] / "ml-training" / "forecast-24h-colab" / "train_24h_forecast.py"
SPEC = importlib.util.spec_from_file_location("train_24h_forecast", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ForecastBaselineTest(unittest.TestCase):
    def test_hourly_resampling_is_invariant_to_future_values(self) -> None:
        timestamps = pd.date_range("2026-01-01", periods=4, freq="1h")

        def make_frame(future_power: float) -> pd.DataFrame:
            return pd.DataFrame(
                {
                    "timestamp": timestamps,
                    "power_kw": [1.0, float("nan"), 3.0, future_power],
                    "reactive_power_kw": [0.1, float("nan"), 0.3, 0.4],
                    "voltage": [220.0, float("nan"), 222.0, 223.0],
                    "current_a": [1.0, float("nan"), 3.0, 4.0],
                    "sub_metering_1": [1.0, float("nan"), 3.0, 4.0],
                    "sub_metering_2": [1.0, float("nan"), 3.0, 4.0],
                    "sub_metering_3": [1.0, float("nan"), 3.0, 4.0],
                }
            )

        first = MODULE.resample_to_hourly(make_frame(4.0))
        changed_future = MODULE.resample_to_hourly(make_frame(4000.0))

        pd.testing.assert_frame_equal(first.iloc[:3], changed_future.iloc[:3])
        self.assertEqual(first.loc[1, "power_kw"], 1.0)

    def test_imputed_power_is_never_used_as_a_supervised_target(self) -> None:
        timestamps = pd.date_range("2025-01-01", periods=500, freq="1h")
        frame = pd.DataFrame(
            {
                "timestamp": timestamps,
                "power_kw": [1.0 + (index % 24) / 10 for index in range(500)],
                "reactive_power_kw": 0.2,
                "voltage": 220.0,
                "current_a": 2.0,
                "sub_metering_1": 1.0,
                "sub_metering_2": 1.0,
                "sub_metering_3": 1.0,
                MODULE.TARGET_OBSERVED_COLUMN: True,
            }
        )
        missing_target_index = 360
        frame.loc[missing_target_index, MODULE.TARGET_OBSERVED_COLUMN] = False

        _features, _targets, origins = MODULE.build_supervised_dataset(frame)

        forbidden_origins = set(timestamps[missing_target_index - MODULE.FORECAST_HORIZON_HOURS:missing_target_index])
        self.assertTrue(forbidden_origins.isdisjoint(set(origins)))

    def test_persistence_repeats_current_power_for_all_horizons(self) -> None:
        features = pd.DataFrame({"power_kw": [1.0, 2.0]})
        targets = pd.DataFrame(
            [[1.0] * MODULE.FORECAST_HORIZON_HOURS, [2.0] * MODULE.FORECAST_HORIZON_HOURS]
        )
        metrics = MODULE.evaluate_persistence(features, targets)
        self.assertEqual(metrics["mae"], 0.0)
        self.assertEqual(metrics["rmse"], 0.0)
        self.assertEqual(metrics["r2"], 1.0)

    def test_daily_seasonal_naive_uses_only_observations_available_at_origin(self) -> None:
        row = {"power_kw": 24.0}
        row.update({f"power_kw_lag_{lag}": float(24 - lag) for lag in range(1, 24)})
        features = pd.DataFrame([row])
        targets = pd.DataFrame([[float(horizon) for horizon in range(1, 25)]])

        metrics = MODULE.evaluate_seasonal_naive(features, targets, 24)

        self.assertEqual(metrics["mae"], 0.0)
        self.assertEqual(metrics["rmse"], 0.0)

    def test_weekly_seasonal_naive_requires_supported_period(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.evaluate_seasonal_naive(pd.DataFrame(), pd.DataFrame(), 48)


if __name__ == "__main__":
    unittest.main()
