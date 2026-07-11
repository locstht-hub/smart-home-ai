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
    def test_persistence_repeats_current_power_for_all_horizons(self) -> None:
        features = pd.DataFrame({"power_kw": [1.0, 2.0]})
        targets = pd.DataFrame(
            [[1.0] * MODULE.FORECAST_HORIZON_HOURS, [2.0] * MODULE.FORECAST_HORIZON_HOURS]
        )
        metrics = MODULE.evaluate_persistence(features, targets)
        self.assertEqual(metrics["mae"], 0.0)
        self.assertEqual(metrics["rmse"], 0.0)
        self.assertEqual(metrics["r2"], 1.0)


if __name__ == "__main__":
    unittest.main()
