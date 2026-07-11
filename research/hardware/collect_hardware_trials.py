from __future__ import annotations

import argparse
import csv
import json
import os
import platform
import socket
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


FIELDS = [
    "run_id",
    "trial_id",
    "network_label",
    "endpoint",
    "started_at_utc",
    "finished_at_utc",
    "latency_ms",
    "http_status",
    "accepted",
    "source",
    "effective_mode",
    "voltage_v",
    "current_a",
    "power_kw",
    "energy_kwh",
    "reading_timestamp",
    "error",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect reproducible read-only PLC power API trials.")
    parser.add_argument("--base-url", required=True, help="Smart Home API base URL, for example http://192.168.1.10:5001")
    parser.add_argument("--home-id", required=True)
    parser.add_argument("--network-label", required=True, help="Stable label such as lan_wifi5 or wan_4g")
    parser.add_argument("--trials", type=int, default=35)
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument("--interval-seconds", type=float, default=1.0)
    parser.add_argument("--timeout-seconds", type=float, default=10.0)
    parser.add_argument("--output-dir", type=Path, default=Path("research/data/raw"))
    parser.add_argument("--token-env", default="SMART_HOME_EXPERIMENT_API_TOKEN")
    parser.add_argument("--allow-non-real", action="store_true", help="Keep mock/fallback rows as accepted. Never use for thesis results.")
    return parser.parse_args()


def fetch_json(url: str, token: str, timeout: float) -> tuple[int, dict[str, Any], str]:
    request = Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return int(response.status), json.loads(body), ""
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = {}
        return int(exc.code), payload, str(payload.get("error") or exc.reason)
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        return 0, {}, str(exc)


def main() -> int:
    args = parse_args()
    if args.trials < 1 or args.warmup < 0:
        raise SystemExit("trials must be positive and warmup must be non-negative")
    token = os.environ.get(args.token_env, "").strip()
    if not token:
        raise SystemExit(f"Missing API token in environment variable {args.token_env}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    run_id = f"hw-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    endpoint = "/api/power/current"
    url = f"{args.base_url.rstrip('/')}{endpoint}?{urlencode({'homeId': args.home_id})}"
    rows: list[dict[str, Any]] = []

    for sequence in range(args.warmup + args.trials):
        started_at = utc_now()
        started_ns = time.perf_counter_ns()
        status, payload, error = fetch_json(url, token, args.timeout_seconds)
        latency_ms = round((time.perf_counter_ns() - started_ns) / 1_000_000.0, 3)
        finished_at = utc_now()
        is_warmup = sequence < args.warmup
        source = str(payload.get("source") or "")
        effective_mode = str(payload.get("effectiveMode") or "")
        is_real = source == "plc-s7-1200" and effective_mode == "plc-real"
        accepted = status == 200 and not error and (is_real or args.allow_non_real)

        if not is_warmup:
            rows.append(
                {
                    "run_id": run_id,
                    "trial_id": sequence - args.warmup + 1,
                    "network_label": args.network_label,
                    "endpoint": endpoint,
                    "started_at_utc": started_at,
                    "finished_at_utc": finished_at,
                    "latency_ms": latency_ms,
                    "http_status": status,
                    "accepted": str(accepted).lower(),
                    "source": source,
                    "effective_mode": effective_mode,
                    "voltage_v": payload.get("voltage"),
                    "current_a": payload.get("current"),
                    "power_kw": payload.get("power_kw"),
                    "energy_kwh": payload.get("energy_kwh"),
                    "reading_timestamp": payload.get("timestamp"),
                    "error": error or ("non-real source rejected" if not is_real and not args.allow_non_real else ""),
                }
            )
        if sequence + 1 < args.warmup + args.trials:
            time.sleep(max(0.0, args.interval_seconds))

    csv_path = args.output_dir / f"{run_id}.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    metadata = {
        "schemaVersion": 1,
        "runId": run_id,
        "createdAtUtc": utc_now(),
        "baseUrl": args.base_url,
        "homeId": args.home_id,
        "networkLabel": args.network_label,
        "endpoint": endpoint,
        "trials": args.trials,
        "warmup": args.warmup,
        "intervalSeconds": args.interval_seconds,
        "timeoutSeconds": args.timeout_seconds,
        "requireRealPlcSource": not args.allow_non_real,
        "tokenEnvironmentVariable": args.token_env,
        "host": socket.gethostname(),
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "acceptedTrials": sum(row["accepted"] == "true" for row in rows),
        "rejectedTrials": sum(row["accepted"] != "true" for row in rows),
    }
    metadata_path = args.output_dir / f"{run_id}.metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print(csv_path)
    print(metadata_path)
    return 0 if metadata["acceptedTrials"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
