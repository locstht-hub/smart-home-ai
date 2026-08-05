from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import pandas as pd


FORECAST_DIR = Path(__file__).resolve().parents[1]
if str(FORECAST_DIR) not in sys.path:
    sys.path.insert(0, str(FORECAST_DIR))

import app as forecast_app  # noqa: E402


class ForecastContractTest(unittest.TestCase):
    def setUp(self) -> None:
        forecast_app.app.testing = True
        self.client = forecast_app.app.test_client()

    @staticmethod
    def hourly_history(rows: int = 338) -> list[dict[str, object]]:
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        return [
            {
                "timestamp": (start + timedelta(hours=index)).isoformat(),
                "power_kw": 1.0 + ((index % 24) / 100),
            }
            for index in range(rows)
        ]

    def test_sample_mode_is_explicit(self) -> None:
        response = self.client.post(
            "/forecast/bundle?model=xgboost",
            json={"allow_sample": True},
        )
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["dataMode"], "sample")
        self.assertEqual(body["historyHourlyRows"], 0)
        self.assertTrue(all(row["source"] == "sample_forecast" for row in body["predictions"]))

    def test_history_preprocessing_does_not_look_ahead(self) -> None:
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)

        def history(future_power: float) -> list[dict[str, object]]:
            return [
                {
                    "timestamp": (start + timedelta(hours=index)).isoformat(),
                    "power_kw": value,
                }
                for index, value in enumerate([1.0, None, 3.0, future_power])
            ]

        first = forecast_app.normalize_history(history(4.0))
        changed_future = forecast_app.normalize_history(history(4000.0))

        pd.testing.assert_frame_equal(first.iloc[:3], changed_future.iloc[:3])
        self.assertEqual(first.loc[1, "power_kw"], 1.0)

    def test_insufficient_history_is_rejected_when_sample_is_disabled(self) -> None:
        response = self.client.post(
            "/forecast/bundle?model=xgboost",
            json={"history": self.hourly_history(48), "allow_sample": False},
        )
        self.assertEqual(response.status_code, 400)

    def test_real_history_label_requires_real_dispatch(self) -> None:
        predicted = [
            {
                "time": "2026-01-16T00:00:00+00:00",
                "predictedKw": 1.2,
                "confidence": 0.7,
                "source": "flask_model",
            }
            for _ in range(24)
        ]
        with patch.object(forecast_app, "dispatch_predictions", return_value=predicted) as dispatch:
            response = self.client.post(
                "/forecast/bundle?model=xgboost",
                json={"history": self.hourly_history(), "allow_sample": False},
            )
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["dataMode"], "real_history")
        self.assertEqual(body["historyHourlyRows"], 338)
        dispatch.assert_called_once()

    def test_malformed_timestamp_and_missing_power_are_rejected(self) -> None:
        malformed = self.client.post(
            "/forecast/bundle?model=xgboost",
            json={"history": [{"timestamp": "not-a-date", "power_kw": 1.0}], "allow_sample": False},
        )
        self.assertEqual(malformed.status_code, 400)
        missing_power = self.client.post(
            "/forecast/bundle?model=xgboost",
            json={"history": [{"timestamp": "2026-01-01T00:00:00Z"}], "allow_sample": False},
        )
        self.assertEqual(missing_power.status_code, 400)

    def test_unknown_model_and_fake_retrain_are_rejected(self) -> None:
        self.assertEqual(self.client.get("/forecast/model-info?model=unknown").status_code, 400)
        self.assertEqual(self.client.post("/forecast/trigger-retrain?model=xgboost").status_code, 501)

    def test_model_info_reports_verified_versioned_artifact(self) -> None:
        response = self.client.get("/forecast/model-info?model=xgboost")
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["artifactFile"], "best_model.joblib")
        self.assertEqual(
            body["artifactSha256"],
            "8fa5e4b5728f59f745b4053ac067c02a1e6c75298ae28b9b4579676ac3d46647",
        )
        self.assertTrue(body["artifactVerified"])


if __name__ == "__main__":
    unittest.main()
