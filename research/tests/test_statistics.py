from __future__ import annotations

import sys
import unittest
from pathlib import Path


HARDWARE_DIR = Path(__file__).resolve().parents[1] / "hardware"
if str(HARDWARE_DIR) not in sys.path:
    sys.path.insert(0, str(HARDWARE_DIR))

from analyze_hardware_trials import percentile, summarize  # noqa: E402


class StatisticsTest(unittest.TestCase):
    def test_percentile_uses_linear_interpolation(self) -> None:
        self.assertEqual(percentile([10, 20, 30, 40, 50], 0.95), 48.0)

    def test_summary_reports_sample_statistics(self) -> None:
        result = summarize([10, 20, 30])
        self.assertEqual(result["n"], 3)
        self.assertEqual(result["mean_ms"], 20.0)
        self.assertEqual(result["median_ms"], 20.0)
        self.assertEqual(result["stddev_ms"], 10.0)


if __name__ == "__main__":
    unittest.main()
