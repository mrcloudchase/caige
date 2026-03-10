---
title: "Monitoring & Observability"
slug: "monitoring-observability"
module: "validating-guardrails"
sectionOrder: 4
description: "Key metrics monitoring, anomaly detection, alert design, dashboard layout, structured logging, and privacy-preserving forensics for guardrail operations."
---

## Section 5.4: Monitoring & Observability

Testing tells you your guardrails work at a point in time. Monitoring tells you they are working *right now*. The difference matters because guardrails degrade — models update, attack patterns evolve, usage patterns shift, and infrastructure changes. A guardrail that passed every test last month can fail silently this month if you are not watching.

Observability goes deeper than monitoring. Monitoring asks "is the guardrail healthy?" Observability asks "when something goes wrong, can I figure out *why*?" Monitoring is the dashboard. Observability is the ability to investigate an incident by tracing a single request through every stage of the guardrail pipeline and understanding exactly what happened and why.

### Key Metrics to Monitor

Four metrics form the core of guardrail monitoring. Changes in any of them signal a problem that requires investigation.

**Block rate** — the percentage of requests blocked by guardrails.

A stable system has a stable block rate. A sudden increase means either a new attack campaign has started or a guardrail rule is over-triggering (false positive spike). A sudden decrease means either attacks have stopped (unlikely) or a guardrail is failing to detect threats (far more likely, and far more dangerous).

```
Block Rate = (Blocked Requests) / (Total Requests) × 100

Normal range: 1–5% (varies by application)
Alert on: >2× or <0.5× the trailing 7-day average
```

**Bypass rate** — the estimated percentage of harmful content that gets through.

This is harder to measure because you need ground truth. Approximate it through: LLM-as-judge sampling of allowed content, human review samples, user reports, and red team probes.

**Latency** — guardrail processing time per request.

Track per-stage latency and total pipeline latency. Latency spikes indicate: model endpoint degradation, resource contention, input volume spikes, or a guardrail stage that is processing abnormally complex inputs.

**Error rate** — the percentage of guardrail evaluations that fail (exceptions, timeouts, malformed responses).

A guardrail that errors out is a guardrail that does not run. Depending on your fail-open or fail-closed configuration, errors either block all users or allow all content through unguarded.

| Metric | Normal State | Yellow Alert | Red Alert | What to Investigate |
|--------|-------------|-------------|-----------|-------------------|
| **Block rate** | 1–5% | 2× baseline | 5× baseline or <0.3× | New attack wave or guardrail false positive spike / guardrail failure |
| **Bypass rate** | < 5% | 5–10% | > 10% | Guardrail evasion, model update impact |
| **p95 latency** | < 200ms | 200–500ms | > 500ms | Model endpoint issues, resource limits |
| **Error rate** | < 0.1% | 0.1–1% | > 1% | Infrastructure failure, API errors |
| **Coverage** | 100% | 99–100% | < 99% | Code path bypassing guardrail middleware |

### Anomaly Detection for Guardrail Behavior

Static thresholds catch obvious failures but miss gradual drift. Anomaly detection identifies unusual patterns that static thresholds would not catch.

**Statistical approaches** compare current metrics to historical baselines:

```python
import statistics

def detect_anomaly(
    current_value: float,
    historical_values: list[float],
    sigma_threshold: float = 3.0,
) -> dict:
    """Detect anomalies using z-score against historical baseline."""
    if len(historical_values) < 30:
        return {"anomaly": False, "reason": "insufficient history"}

    mean = statistics.mean(historical_values)
    stdev = statistics.stdev(historical_values)

    if stdev == 0:
        return {"anomaly": current_value != mean, "z_score": float("inf")}

    z_score = (current_value - mean) / stdev

    return {
        "anomaly": abs(z_score) > sigma_threshold,
        "z_score": z_score,
        "mean": mean,
        "stdev": stdev,
        "current": current_value,
        "direction": "high" if z_score > 0 else "low",
    }
```

**Pattern-based anomalies** to watch for:

| Anomaly Pattern | What It Looks Like | What It Usually Means |
|----------------|-------------------|---------------------|
| **Block rate spike** | Block rate jumps from 3% to 15% in an hour | Coordinated attack campaign or guardrail false positive bug |
| **Block rate drop** | Block rate drops from 3% to 0.5% | Guardrail stage failing silently, model update changed behavior |
| **Latency creep** | p95 slowly increases from 150ms to 300ms over a week | Resource exhaustion, growing input sizes, classifier model degradation |
| **Error burst** | Error rate spikes to 10% for 5 minutes then recovers | Upstream dependency outage, network blip |
| **Category shift** | Toxicity blocks increase 5× while injection blocks stay flat | New user population or attack focus change |
| **Time-of-day anomaly** | Block rate spikes at 2 AM local time | Automated attack bots, geographically distributed attackers |

### Alert Design

Not every anomaly deserves the same response. Alert severity should match the potential impact and the required response speed.

![Escalation paths showing severity tiers from log entry through ticket to page](/svg/escalation-paths.svg)

| Severity | Criteria | Response | Channel | SLA |
|----------|----------|----------|---------|-----|
| **P0 — Critical** | Guardrails completely failing, all traffic unguarded; active data breach via guardrail bypass | Page on-call engineer immediately, initiate incident response | PagerDuty/Opsgenie | 15 min acknowledge, 1 hour mitigate |
| **P1 — High** | Significant increase in bypass rate; guardrail stage errors > 5%; block rate dropped > 60% | Page on-call during business hours, ticket after hours | PagerDuty + Slack | 1 hour acknowledge, 4 hours mitigate |
| **P2 — Medium** | Block rate deviation > 2× baseline; p95 latency exceeding SLO; coverage dropped below 99.5% | Create ticket, investigate within business day | Slack + Jira | 4 hours acknowledge, 24 hours mitigate |
| **P3 — Low** | Minor metric drift; single guardrail stage latency increase; cosmetic logging issues | Log for review, include in weekly metrics review | Dashboard + weekly report | Next business day review |

Alert design principles:
- **Alert on symptoms, not causes** — alert on "block rate dropped 50%" not "classifier model returned null"
- **Include context in the alert** — current value, baseline value, affected metric, link to dashboard
- **Deduplicate** — do not page someone 50 times for the same ongoing issue
- **Auto-resolve** — if the metric recovers, close the alert automatically
- **Runbook link** — every alert should link to a runbook describing investigation steps

### Dashboard Design for Guardrail Operations

A well-designed dashboard tells the guardrail operator what they need to know at a glance: *are the guardrails healthy, and if not, where is the problem?*

```
┌──────────────────────────────────────────────────────────────────────┐
│                    GUARDRAIL OPERATIONS DASHBOARD                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Block Rate  │  │ Error Rate  │  │ p95 Latency │  │ Coverage   │ │
│  │   3.2%  ✓   │  │  0.02%  ✓   │  │  145ms  ✓   │  │  100%  ✓   │ │
│  │ (baseline:  │  │ (baseline:  │  │ (SLO:       │  │ (target:   │ │
│  │   2.8%)     │  │   0.03%)    │  │   200ms)    │  │   100%)    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Block Rate Over Time (24h rolling)                   │   │
│  │  5% ┤                                                        │   │
│  │     │      ╱╲                                                │   │
│  │  3% ┤─────╱──╲───────────────────────────────────────────    │   │
│  │     │    ╱    ╲                  ╱╲                           │   │
│  │  1% ┤──╱──────╲────────────────╱──╲──────────────────────    │   │
│  │     └────────────────────────────────────────────────────    │   │
│  │      00:00    06:00    12:00    18:00    00:00               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────┐  ┌─────────────────────────────┐   │
│  │   Blocks by Category       │  │   Latency by Stage          │   │
│  │                             │  │                              │   │
│  │  Injection:    ████░ 42%   │  │  Rules:      █░ 2ms          │   │
│  │  Toxicity:     ███░░ 31%   │  │  ML:         ████░ 38ms      │   │
│  │  PII:          ██░░░ 18%   │  │  Embedding:  ███░░ 22ms      │   │
│  │  Off-topic:    █░░░░  9%   │  │  LLM Judge:  ████████░ 420ms │   │
│  └────────────────────────────┘  └─────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            Recent Events (last 1 hour)                       │   │
│  │  14:23:01  BLOCK  injection   stage=rule_based  2ms          │   │
│  │  14:22:58  ALLOW  —          stage=all_passed   87ms         │   │
│  │  14:22:45  BLOCK  toxicity   stage=ml_classifier 41ms        │   │
│  │  14:22:39  ERROR  timeout    stage=llm_judge    3001ms       │   │
│  │  14:22:31  ALLOW  —          stage=all_passed   92ms         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

Dashboard layout principles:
- **Top row: health indicators** — big numbers with color coding (green/yellow/red) showing current state vs baseline or SLO
- **Middle row: time series** — block rate, latency, and error rate over time to reveal trends
- **Bottom rows: breakdowns** — blocks by category, latency by pipeline stage, recent events
- **Drill-down capability** — click on any metric to see per-endpoint, per-user-segment, or per-guardrail-stage detail

### Structured Logging for Guardrail Events

Every guardrail decision should produce a structured log entry that captures enough information for debugging, investigation, and metrics without storing sensitive content.

```python
import hashlib
import time
import json
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timezone


@dataclass
class GuardrailLogEntry:
    timestamp: str
    request_id: str
    input_hash: str
    input_length: int
    decision: str
    guardrail_stage: str
    confidence: float
    latency_ms: float
    categories_checked: list[str]
    categories_flagged: list[str]
    pipeline_version: str
    model_id: str | None
    error: str | None

    def to_json(self) -> str:
        return json.dumps(asdict(self), default=str)


def log_guardrail_decision(
    request_id: str,
    input_text: str,
    result,
    pipeline_version: str,
    model_id: str | None = None,
) -> GuardrailLogEntry:
    """Create a structured, privacy-preserving log entry for a guardrail decision."""
    entry = GuardrailLogEntry(
        timestamp=datetime.now(timezone.utc).isoformat(),
        request_id=request_id,
        input_hash=hashlib.sha256(input_text.encode()).hexdigest()[:16],
        input_length=len(input_text),
        decision=result.decision.value,
        guardrail_stage=result.stage,
        confidence=result.confidence,
        latency_ms=result.latency_ms,
        categories_checked=result.categories_checked,
        categories_flagged=result.categories_flagged,
        pipeline_version=pipeline_version,
        model_id=model_id,
        error=None,
    )

    logger = logging.getLogger("guardrail.decisions")
    logger.info(entry.to_json())

    return entry
```

### Privacy-Preserving Logging

Guardrail logs must balance two competing needs: enough information to investigate incidents and debug issues, versus user privacy and regulatory compliance. The wrong balance in either direction is costly — too little logging leaves you blind during incidents, and too much logging creates a data liability.

| What to Log | Why | Example |
|-------------|-----|---------|
| **Decision** (allow/block) | Core metric computation | `"decision": "block"` |
| **Guardrail stage** that made the decision | Debug which stage triggered or passed | `"stage": "ml_classifier"` |
| **Confidence score** | Threshold tuning analysis | `"confidence": 0.87` |
| **Latency** per stage and total | Performance monitoring | `"latency_ms": 142.3` |
| **Input hash** (SHA-256 truncated) | Correlate repeat inputs without storing content | `"input_hash": "a3f2b91c"` |
| **Input length** | Detect anomalous input sizes | `"input_length": 847` |
| **Categories flagged** | Understand what types of content are caught | `"categories_flagged": ["injection"]` |
| **Request ID** | Trace through full request lifecycle | `"request_id": "req-abc123"` |
| **Pipeline version** | Correlate metrics with guardrail config changes | `"pipeline_version": "v2.4.1"` |
| **Timestamp** (UTC ISO-8601) | Time-based analysis and incident correlation | `"timestamp": "2025-09-15T14:23:01Z"` |

| What to NEVER Log | Why Not | Alternative |
|-------------------|---------|-------------|
| **Raw user input** | PII exposure, regulatory risk, liability if breached | Log input hash and input length only |
| **Raw model output** | May contain PII, hallucinations, or harmful content | Log output length, truncated first 20 chars of benign outputs only |
| **User identity with content** | Creates a dataset linking users to their queries | Log user ID separately from content hashes |
| **Full conversation history** | Massive PII surface, storage cost, breach liability | Log conversation ID, turn count, and per-turn decisions |
| **Exact matched patterns** | Reveals guardrail rule details to log readers | Log pattern category (e.g., "injection_pattern_3") |
| **Classification model internals** | Internal weights/scores are IP and don't aid debugging | Log final confidence score only |

> **Why this matters for guardrails:** Logs are the forensic record of your guardrail system. When an incident occurs — a bypass is discovered, a false positive wave hits users, or a stakeholder asks "how many injection attempts did we block last month?" — logs are the only source of truth. But logs that contain raw user inputs are themselves a security and privacy risk. The input hash pattern solves this: you can detect and count repeat inputs, correlate across systems, and investigate patterns without ever storing the actual content.

### Log Analysis and Forensics

When a guardrail incident occurs, structured logs enable systematic investigation. The typical forensic workflow follows a pattern:

**Step 1: Scope the incident.** Identify the time window, affected endpoints, and impacted users using aggregate queries on decision, stage, and timestamp fields.

**Step 2: Identify anomalies.** Compare metrics in the incident window against baseline. Which stages saw unusual behavior? Did block rates change? Did error rates spike?

**Step 3: Trace representative requests.** Use request IDs to trace individual requests through the full pipeline. Examine the decision at each stage, the confidence scores, and the latency.

**Step 4: Correlate with changes.** Check the pipeline version field against deployment history. Did a guardrail config change immediately precede the incident? Did a model update occur?

**Step 5: Determine root cause.** The combination of scoping, anomaly identification, request tracing, and change correlation usually narrows the cause to one of: guardrail rule change, model update, new attack pattern, or infrastructure issue.

```python
def investigate_guardrail_incident(
    logs: list[GuardrailLogEntry],
    incident_start: datetime,
    incident_end: datetime,
) -> dict:
    """Aggregate guardrail logs for incident investigation."""
    incident_logs = [
        log for log in logs
        if incident_start <= datetime.fromisoformat(log.timestamp) <= incident_end
    ]

    total = len(incident_logs)
    blocks = [l for l in incident_logs if l.decision == "block"]
    errors = [l for l in incident_logs if l.error is not None]
    stages_triggered = {}
    for log in blocks:
        stages_triggered[log.guardrail_stage] = stages_triggered.get(
            log.guardrail_stage, 0
        ) + 1

    pipeline_versions = set(l.pipeline_version for l in incident_logs)

    return {
        "total_events": total,
        "block_count": len(blocks),
        "block_rate": len(blocks) / total if total > 0 else 0,
        "error_count": len(errors),
        "error_rate": len(errors) / total if total > 0 else 0,
        "stages_triggered": stages_triggered,
        "pipeline_versions_active": list(pipeline_versions),
        "avg_latency_ms": sum(l.latency_ms for l in incident_logs) / total if total > 0 else 0,
        "p95_latency_ms": sorted(l.latency_ms for l in incident_logs)[
            int(total * 0.95)
        ] if total > 0 else 0,
    }
```

When your investigation reveals the root cause, the final step is always the same: convert the finding into a regression test, update guardrail rules if needed, and add the incident pattern to your monitoring so you detect it automatically if it recurs.

---
