from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from importlib import metadata
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]

SUITES = [
    ("verify", ["run", "verify"]),
    ("backend", ["run", "test:backend"]),
    ("forecast", ["run", "test:forecast"]),
    ("research", ["run", "test:research"]),
    ("frontend_contract", ["run", "test:frontend-contract"]),
    ("admin_audit", ["run", "test:admin-audit"]),
    ("room_presentation", ["run", "test:room-presentation"]),
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def package_version(name: str) -> str | None:
    try:
        return metadata.version(name)
    except metadata.PackageNotFoundError:
        return None


def command_output(command: list[str]) -> str | None:
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
    except OSError:
        return None
    return result.stdout.strip() if result.returncode == 0 else None


def parse_counts(text: str) -> tuple[int, int]:
    total = 0
    passed = 0
    for match in re.finditer(r"Ran\s+(\d+)\s+tests?", text):
        count = int(match.group(1))
        total += count
        tail = text[match.end(): match.end() + 600]
        failures = sum(int(value) for value in re.findall(r"(?:failures|errors)=(\d+)", tail))
        passed += max(0, count - failures)
    tap_prefix = r"(?:#|ℹ|â„¹)"
    node_totals = [
        int(value)
        for value in re.findall(rf"^{tap_prefix}\s*tests\s+(\d+)\s*$", text, re.MULTILINE)
    ]
    node_passed = [
        int(value)
        for value in re.findall(rf"^{tap_prefix}\s*pass\s+(\d+)\s*$", text, re.MULTILINE)
    ]
    total += sum(node_totals)
    passed += sum(node_passed)
    return passed, total


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run software verification and capture reproducible evidence logs.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("research/results/software_evidence"),
    )
    parser.add_argument(
        "--parse-existing",
        action="store_true",
        help="Rebuild the JSON manifest from existing suite logs without rerunning commands.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        raise RuntimeError("npm executable was not found")

    existing_payload_path = args.output_dir / "software_evidence.json"
    existing_payload = (
        json.loads(existing_payload_path.read_text(encoding="utf-8"))
        if args.parse_existing and existing_payload_path.exists()
        else {}
    )
    tested_at = existing_payload.get("testedAtUtc") or datetime.now(timezone.utc).isoformat()
    suite_rows: list[dict[str, Any]] = []
    for suite_name, npm_args in SUITES:
        command = [npm, *npm_args]
        log_path = args.output_dir / f"{suite_name}.log"
        if args.parse_existing:
            if not log_path.exists():
                raise FileNotFoundError(log_path)
            log_text = log_path.read_text(encoding="utf-8")
            exit_match = re.search(r"^exitCode:\s*(\d+)\s*$", log_text, re.MULTILINE)
            elapsed_match = re.search(r"^elapsedSeconds:\s*([0-9.]+)\s*$", log_text, re.MULTILINE)
            return_code = int(exit_match.group(1)) if exit_match else 1
            elapsed_seconds = float(elapsed_match.group(1)) if elapsed_match else 0.0
        else:
            started = time.perf_counter()
            result = subprocess.run(
                command,
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                check=False,
            )
            elapsed_seconds = time.perf_counter() - started
            return_code = result.returncode
            log_text = (
                f"command: {' '.join(npm_args)}\n"
                f"startedAtUtc: {tested_at}\n"
                f"exitCode: {result.returncode}\n"
                f"elapsedSeconds: {elapsed_seconds:.3f}\n\n"
                f"--- stdout ---\n{result.stdout}\n\n--- stderr ---\n{result.stderr}\n"
            )
            log_path.write_text(log_text, encoding="utf-8")
        passed, total = parse_counts(log_text)
        suite_rows.append(
            {
                "suite": suite_name,
                "command": "npm " + " ".join(npm_args),
                "passed": passed,
                "total": total,
                "status": "passed" if return_code == 0 else "failed",
                "exitCode": return_code,
                "elapsedSeconds": round(elapsed_seconds, 3),
                "logPath": log_path.as_posix(),
                "logSha256": sha256_file(log_path),
            }
        )

    by_name = {row["suite"]: row for row in suite_rows}

    def suites_pass(*names: str) -> bool:
        return all(by_name[name]["status"] == "passed" for name in names)

    commit_sha = command_output(["git", "rev-parse", "HEAD"])
    git_status = command_output(["git", "status", "--porcelain"])
    claims = {
        "authorizationAndHomeScope": suites_pass("backend"),
        "telemetryCredentialIsolation": suites_pass("backend"),
        "plcFeedbackAndFailClosed": suites_pass("backend"),
        "forecastArtifactContract": suites_pass("forecast", "research"),
        "applicationStateContract": suites_pass("frontend_contract", "room_presentation"),
        "fullRepositoryVerification": suites_pass("verify"),
    }
    payload = {
        "schemaVersion": 1,
        "testedAtUtc": tested_at,
        "commitSha": commit_sha,
        "workingTreeDirty": bool(git_status),
        "runtime": {
            "platform": platform.platform(),
            "python": sys.version.split()[0],
            "node": command_output(["node", "--version"]),
            "npm": command_output([npm, "--version"]),
            "libraries": {
                "numpy": package_version("numpy"),
                "pandas": package_version("pandas"),
                "scikit-learn": package_version("scikit-learn"),
                "xgboost": package_version("xgboost"),
                "tensorflow": package_version("tensorflow"),
            },
        },
        "suites": suite_rows,
        "claimPermissions": claims,
    }
    output_path = args.output_dir / "software_evidence.json"
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output_path)
    print(json.dumps({"claims": claims, "suites": suite_rows}, ensure_ascii=False, indent=2))
    return 0 if all(row["status"] == "passed" for row in suite_rows) else 1


if __name__ == "__main__":
    raise SystemExit(main())
