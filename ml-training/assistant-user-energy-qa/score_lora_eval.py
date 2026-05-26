from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


NUMBER_RE = re.compile(r"(?<!UA-)\b\d+([.,]\d+)?\s*(kwh|kw|%|đ|vnd|dong|đồng)?", re.IGNORECASE)


def has_forbidden(answer: str, forbidden: list[str]) -> list[str]:
    answer_lower = answer.lower()
    return [term for term in forbidden if term and term.lower() in answer_lower]


def has_risky_number(answer: str) -> bool:
    return NUMBER_RE.search(answer) is not None


def score_row(row: dict) -> tuple[int, list[str]]:
    issues: list[str] = []
    answer = row.get("answer", "").strip()
    if not answer:
        issues.append("empty_answer")
        return 0, issues

    forbidden_hits = has_forbidden(answer, row.get("forbidden", []))
    if forbidden_hits:
        issues.append("forbidden:" + ",".join(forbidden_hits))

    if row.get("no_number") and has_risky_number(answer):
        issues.append("risky_number")

    if len(answer) > 900:
        issues.append("too_long")

    if issues:
        return 1 if answer else 0, issues
    return 2, issues


def main() -> None:
    parser = argparse.ArgumentParser(description="Score User Energy Assistant evaluation outputs with simple heuristics.")
    parser.add_argument("--input", default="test_outputs/user_energy_eval_outputs.jsonl")
    parser.add_argument("--report", default="test_outputs/user_energy_eval_report.md")
    args = parser.parse_args()

    input_path = Path(args.input)
    rows = [json.loads(line) for line in input_path.read_text(encoding="utf-8").splitlines() if line.strip()]

    total = 0
    lines = [
        "# User Energy Assistant Eval Report",
        "",
        "| ID | Score | Issues | Question | Answer |",
        "| --- | ---: | --- | --- | --- |",
    ]

    for row in rows:
        score, issues = score_row(row)
        total += score
        question = row["question"].replace("|", "\\|")
        answer = row.get("answer", "").replace("\n", " ").replace("|", "\\|")
        if len(answer) > 220:
            answer = answer[:217] + "..."
        lines.append(
            f"| {row['id']} | {score}/2 | {', '.join(issues) if issues else 'ok'} | {question} | {answer} |"
        )

    max_score = len(rows) * 2
    percent = (total / max_score * 100) if max_score else 0
    verdict = "PASS" if percent >= 85 else "NEEDS_REVIEW" if percent >= 70 else "FAIL"

    lines.insert(2, f"**Score:** {total}/{max_score} ({percent:.1f}%) - **{verdict}**")
    lines.insert(3, "")

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Score: {total}/{max_score} ({percent:.1f}%) - {verdict}")
    print(f"Wrote {report_path}")


if __name__ == "__main__":
    main()
