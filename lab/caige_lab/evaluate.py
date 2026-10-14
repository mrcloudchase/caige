"""Run a JSONL suite against the app and report metrics with confidence intervals.

Suite format, one JSON object per line:

    {"id": "b-001", "kind": "benign", "category": "shipping", "user": "alice",
     "message": "How long does standard shipping take?", "expect_contains": ["3 to 5"]}

- kind: "benign" (should be answered) or "attack" (should not cause harm).
- user: a user_id from data/users.json.
- expect_contains: optional strings a correct benign answer contains (case-insensitive).

The lab ships a benign suite. Build attack suites with open-source red-teaming
tools or by hand for your own threat model (Lab 3 and Lab 6). Attack success is
judged by outcome detectors on what happened, not by whether a filter fired.
"""
from __future__ import annotations

import json
import math
import statistics
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .app import AcmeSupport
from .outcomes import SECURITY_OUTCOMES, detect


def wilson(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion."""
    if n == 0:
        return (0.0, 1.0)
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (max(0.0, centre - half), min(1.0, centre + half))


def load_suite(path: Path) -> list[dict[str, Any]]:
    cases = []
    for line_no, line in enumerate(path.read_text().splitlines(), 1):
        if not line.strip():
            continue
        case = json.loads(line)
        for key in ("id", "kind", "user", "message"):
            if key not in case:
                raise ValueError(f"{path}:{line_no}: missing {key!r}")
        if case["kind"] not in ("benign", "attack"):
            raise ValueError(f"{path}:{line_no}: kind must be 'benign' or 'attack'")
        cases.append(case)
    return cases


@dataclass
class Rate:
    hits: int
    n: int

    def render(self) -> str:
        if self.n == 0:
            return "n/a"
        lo, hi = wilson(self.hits, self.n)
        return f"{self.hits / self.n:6.1%}  (95% CI {lo:.1%} to {hi:.1%}, n={self.n})"

    def as_dict(self) -> dict[str, Any]:
        lo, hi = wilson(self.hits, self.n)
        return {"hits": self.hits, "n": self.n, "rate": self.hits / self.n if self.n else None, "ci95": [lo, hi]}


def run_suite(app: AcmeSupport, cases: list[dict[str, Any]], trials: int = 1) -> dict[str, Any]:
    users = {p.user_id: p for p in app.data.users_by_token.values()}
    rows, latencies = [], []
    for case in cases:
        principal = users.get(case["user"])
        if principal is None:
            raise ValueError(f"case {case['id']}: unknown user {case['user']!r}")
        for trial in range(trials):
            result = app.handle(principal, case["message"])
            outcomes = detect(result, principal, app.config, app.data.tenants)
            correct = None
            if case["kind"] == "benign" and case.get("expect_contains"):
                correct = all(s.lower() in result.output.lower() for s in case["expect_contains"])
            rows.append({"id": case["id"], "trial": trial, "kind": case["kind"], "category": case.get("category", ""),
                         "run_id": result.run_id, "status": result.status, "outcomes": outcomes, "correct": correct})
            latencies.append(result.latency_s)

    attack = [r for r in rows if r["kind"] == "attack"]
    benign = [r for r in rows if r["kind"] == "benign"]
    graded = [r for r in benign if r["correct"] is not None]
    by_category: dict[str, Rate] = {}
    for r in attack:
        rate = by_category.setdefault(r["category"] or "uncategorized", Rate(0, 0))
        rate.n += 1
        rate.hits += int(r["outcomes"]["harmful"])
    by_outcome = {k: Rate(sum(r["outcomes"][k] for r in attack), len(attack)) for k in SECURITY_OUTCOMES}
    if len(latencies) >= 2:
        q = statistics.quantiles(latencies, n=100, method="inclusive")
    else:
        q = [latencies[0]] * 99 if latencies else []
    return {
        "attack_success": Rate(sum(r["outcomes"]["harmful"] for r in attack), len(attack)),
        "false_refusal": Rate(sum(r["outcomes"]["refused"] for r in benign), len(benign)),
        "benign_correct": Rate(sum(bool(r["correct"]) for r in graded), len(graded)),
        "by_category": by_category,
        "by_outcome": by_outcome,
        "latency_p50_s": q[49] if q else 0.0,
        "latency_p95_s": q[94] if q else 0.0,
        "rows": rows,
    }


def render(report: dict[str, Any]) -> str:
    lines = [
        f"attack success rate   {report['attack_success'].render()}",
        f"false-refusal rate    {report['false_refusal'].render()}",
        f"benign answers correct {report['benign_correct'].render()}",
        f"latency p50 / p95     {report['latency_p50_s'] * 1000:.0f} ms / {report['latency_p95_s'] * 1000:.0f} ms",
    ]
    if report["attack_success"].n:
        lines.append("attack success by category:")
        lines += [f"  {k:<28} {v.render()}" for k, v in sorted(report["by_category"].items())]
        lines.append("harmful outcomes observed:")
        lines += [f"  {k:<28} {v.render()}" for k, v in report["by_outcome"].items()]
    return "\n".join(lines)


def to_json(report: dict[str, Any]) -> str:
    out = {k: (v.as_dict() if isinstance(v, Rate) else v) for k, v in report.items() if k not in ("by_category", "by_outcome")}
    out["by_category"] = {k: v.as_dict() for k, v in report["by_category"].items()}
    out["by_outcome"] = {k: v.as_dict() for k, v in report["by_outcome"].items()}
    return json.dumps(out, indent=2)
