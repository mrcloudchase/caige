---
id: "7.1"
title: "Monitoring and Alerting"
slug: monitoring-and-alerting
module: operations-and-governance
sectionOrder: 1
description: "Which operational signals show that a guardrail has stopped working, how to alert on relative change without drowning on-call, and how to keep a governed sample of real traffic for review."
category: cross-cutting
controlLayers: [runtime-ml, deterministic, human]
knowledge:
  - "The core operational metrics for a guardrailed AI system: block rate, bypass signals, refusal rate, guardrail error and timeout rate, coverage, latency, and cost"
  - "Why a falling block rate is usually more dangerous than a rising one, and why labeled attack probes are needed to tell the two apart"
  - "Why alert thresholds should be relative to a seasonal baseline, with a minimum-volume floor, rather than absolute percentage-point deltas"
  - "The causes of alert fatigue and the difference between paging alerts, ticket alerts, and dashboard-only signals"
  - "How a governed sample store (access-controlled, purpose-limited, retention-limited, redacted at write time) differs from both 'log everything' and 'never keep content'"
  - "Why unkeyed hashes of user content are not anonymization"
skills:
  - "Design an alert policy for a guardrail pipeline with relative thresholds, minimum volumes, and a clear page/ticket split"
  - "Implement a relative-change alert check that handles low volume and a zero baseline safely"
  - "Design a sample store for human review, judge calibration, and forensics, including access, retention, and redaction rules"
  - "Build dashboards for three audiences: on-call, guardrail owners, and leadership"
sources:
  - title: "Google SRE Book: Monitoring Distributed Systems"
    url: "https://sre.google/sre-book/monitoring-distributed-systems/"
  - title: "Google SRE Workbook: Alerting on SLOs"
    url: "https://sre.google/workbook/alerting-on-slos/"
lastReviewed: "2026-10-14"
---

# 7.1 Monitoring and Alerting

## The problem

A support assistant has run for six months with an input injection classifier and an output policy classifier. Its block rate sits around 3% of requests. On a Tuesday the team ships an unrelated change: the API gateway starts passing requests through a new route that strips a header the guardrail service uses to decide which policy to load. For requests on the new route, the guardrail service falls back to an empty policy and allows everything. Over the next week the overall block rate drifts from 3.0% to 1.1%. Nobody is paged. The dashboard shows a green "error rate 0.00%" tile, because nothing errored. The drop is found eleven days later when a customer posts a screenshot of the assistant reproducing another customer's order details.

Each signal the team monitored was healthy. They tracked errors, latency, and absolute block rate against a fixed band of "1% to 10%", and 1.1% sat inside it. They had no signal that answered "is the guardrail still catching the things it is supposed to catch?"

## Why it happens

Guardrails fail quietly. A web service that breaks usually returns errors. A guardrail that breaks usually returns *allow*, which looks like success. Four mechanisms produce most silent failures:

| Mechanism | What it looks like on a dashboard |
|---|---|
| Coverage loss: a new code path, route, tool, or client skips the guardrail | Block rate falls; error rate unchanged |
| Configuration drift: a threshold, policy, or rule file changes or fails to load | Block rate shifts in either direction; no errors |
| Upstream change: the provider updates the model, or your prompt changes, and outputs move away from what the classifier was tuned for | Block rate or refusal rate shifts gradually |
| Adversary adaptation: attackers find a phrasing the detector misses | Block rate unchanged or falls; bypasses appear only in user reports or review samples |

Two measurement problems make this worse. Block rate on its own cannot tell you *why* it changed: a drop can mean attackers left, or that your detector stopped detecting. And absolute thresholds hide large relative changes at low base rates. Going from 3% to 1.1% is a 1.9 percentage-point change, which looks small, and a 63% relative drop, which is not.

The Google SRE book's advice applies directly: alert on symptoms that users or the business care about, keep paging alerts rare and actionable, and push everything else to tickets and dashboards. The guardrail-specific twist is that the most important symptom, missed attacks, is not visible in normal traffic metrics at all. You have to inject it.

## Control patterns

Controls are listed from strongest to weakest evidence that the guardrail is doing its job.

### 1. Labeled detection probes (deterministic harness, measures runtime-ml)

Send a fixed set of labeled requests through the production path on a schedule: known attacks that must be blocked, and known-benign requests that must be allowed. Because you know the right answer for each probe, a probe failure is direct evidence of a broken guardrail, not an inference from traffic statistics. Probes catch coverage loss (if they enter through each route and client type), configuration drift, and some model drift. They do not catch novel attacks, because you only probe what you already know about.

Run probes through the same entry points as real users, tagged so that their outputs are not shown to anyone and are excluded from business metrics. A probe that enters through a private test endpoint proves nothing about the public route.

### 2. Coverage checks (deterministic)

Count model calls at the model gateway and guardrail decisions at the guardrail service, and compare them. Every model call should have a matching guardrail decision record with the same request ID. Coverage below the target means some traffic is unguarded, regardless of what the block rate says. This is the check that would have caught the opening scenario on day one.

### 3. Relative-change alerts on operational metrics (deterministic)

Compare each metric to a seasonal baseline (the same hour of the week over recent weeks), and alert on the ratio. Require a minimum request volume before the ratio is trusted. Decide per metric which direction is dangerous.

### 4. Sampled review of allowed traffic (human and runtime-ml)

Draw a random sample of *allowed* requests and responses into a governed sample store (described below), and have human reviewers or a validated LLM judge label them. This is the only routine way to estimate the false negative rate on live traffic, and it is how you find novel bypasses before users report them. A judge used here must itself be validated against human labels ([6.3](/training/module/evaluation-and-red-teaming/validating-judges-and-classifiers)).

### 5. User reports and external signals (human)

A report button, abuse inbox, and security contact feed real bypasses to you. They are slow and biased toward visible harms, but they surface what nothing else does.

## The metrics

| Metric | Definition | Dangerous direction | What it detects |
|---|---|---|---|
| Block rate | Blocked requests / total requests, per guardrail stage and per route | Down (silent failure); up (false positive wave) | Coverage loss, config drift, attack campaigns |
| Detection probe pass rate | Probes with the expected decision / probes sent | Down | Broken detectors, broken routes, failed config loads |
| Coverage | Model calls with a matching guardrail decision / all model calls | Down | Unguarded code paths |
| Bypass signals | Judge- or human-labeled violations in the allowed sample; user reports; red-team findings | Up | Novel attacks, detector blind spots |
| Refusal rate | Responses that decline the request / total responses | Up (over-refusal) and down | Prompt or model changes, policy drift ([4.4](/training/module/safety-engineering/over-refusal-and-refusal-design)) |
| Guardrail error and timeout rate | Guardrail evaluations that raised, timed out, or returned malformed output | Up | Dependency outages; fail-open or fail-closed paths being exercised ([4.7](/training/module/safety-engineering/streaming-latency-and-failure-behavior)) |
| Latency | p50, p95, p99 per guardrail stage and end to end | Up | Overloaded classifiers, slow judges |
| Cost | Guardrail spend per 1,000 requests, by stage | Up | Runaway judge calls, retry storms, abuse |

### Illustrative thresholds used throughout Domain 7

These numbers are examples for a mid-volume consumer assistant. Your values come from your own baselines and risk tolerance. Domain 7 uses this one set consistently, including in the canary criteria in [7.3](/training/module/operations-and-governance/change-management) and the release gate in [7.4](/training/module/operations-and-governance/release-gates-and-documentation).

| Signal | Page (wake someone up) | Ticket (next business day) |
|---|---|---|
| Block rate, ratio to same-hour baseline, at least 500 requests in the window | ratio at or below 0.5x | ratio at or above 2.0x |
| Detection probe pass rate (critical probes) | below 95%, or any single critical probe failing on two consecutive runs | any non-critical probe failing on two consecutive runs |
| Coverage | below 99.5% over 15 minutes | n/a |
| Guardrail error and timeout rate | above 1% over 10 minutes | above 0.1% over 1 hour |
| p95 guardrail latency | n/a | above the 300 ms SLO for 30 minutes |
| Refusal rate, ratio to baseline | n/a | at or above 2.0x or at or below 0.5x |
| Estimated false negative rate from the reviewed allowed sample | above 10% (the release red line from 7.4) | any rise of 2.0x or more over the previous review period |
| Guardrail cost per 1,000 requests, ratio to baseline | n/a | at or above 2.0x |

Notice the asymmetry on block rate. A rise usually means a false positive wave or an attack campaign that the guardrail is catching; both hurt, but users are protected. A fall can mean users are unprotected, so it pages. If a rise coincides with probe failures or bypass signals, escalate it too.

### Alert fatigue

Every page that turns out not to need action teaches the on-call engineer to ignore the next one. The SRE workbook's guidance on SLO alerting is a useful model: alert on sustained, significant deviation; use longer windows for low-severity alerts; and do not page on anything a human cannot act on right now. Practical rules for guardrail alerts:

- Page only on the signals in the "Page" column. Everything else is a ticket or a dashboard.
- Put a minimum volume on every ratio. At 3 a.m. with 40 requests in an hour, a block rate of 0% is noise.
- Deduplicate: one incident, one page, with updates in the incident channel.
- Every alert names the metric, current value, baseline, ratio, affected routes, and a runbook link.
- Review alert quality monthly: for each page, was it actionable? Delete or demote alerts that were not.

## Implementation

### Relative-change alert check

```python
from dataclasses import dataclass
from enum import Enum


class Action(Enum):
    NONE = "none"
    TICKET = "ticket"
    PAGE = "page"
    INSUFFICIENT_DATA = "insufficient_data"


@dataclass(frozen=True)
class RatioRule:
    metric: str
    page_at_or_below: float | None   # e.g. 0.5 for block rate
    page_at_or_above: float | None
    ticket_at_or_below: float | None
    ticket_at_or_above: float | None  # e.g. 2.0 for block rate
    min_requests: int                 # do not trust the ratio below this volume


BLOCK_RATE_RULE = RatioRule(
    metric="block_rate",
    page_at_or_below=0.5,
    page_at_or_above=None,
    ticket_at_or_below=None,
    ticket_at_or_above=2.0,
    min_requests=500,
)


def evaluate_ratio(rule: RatioRule, current_rate: float, baseline_rate: float,
                   window_requests: int) -> tuple[Action, float | None]:
    """Compare a rate to its seasonal baseline using a ratio, not a point delta."""
    if window_requests < rule.min_requests:
        return Action.INSUFFICIENT_DATA, None
    if baseline_rate <= 0.0:
        # A zero baseline makes the ratio undefined. Any non-zero current rate
        # is a change worth a human look; zero against zero is no change.
        return (Action.TICKET, None) if current_rate > 0.0 else (Action.NONE, None)

    ratio = current_rate / baseline_rate
    if rule.page_at_or_below is not None and ratio <= rule.page_at_or_below:
        return Action.PAGE, ratio
    if rule.page_at_or_above is not None and ratio >= rule.page_at_or_above:
        return Action.PAGE, ratio
    if rule.ticket_at_or_below is not None and ratio <= rule.ticket_at_or_below:
        return Action.TICKET, ratio
    if rule.ticket_at_or_above is not None and ratio >= rule.ticket_at_or_above:
        return Action.TICKET, ratio
    return Action.NONE, ratio
```

In the opening scenario, a 1.1% block rate against a 3.0% baseline gives a ratio of 0.37, which pages. The `INSUFFICIENT_DATA` result is not silently dropped: route it to the dashboard, and if a route stays below minimum volume for a long period, that is itself worth checking (did traffic move somewhere unguarded?).

### Decision log record

Every guardrail decision writes a structured record to the decision log. This record holds metadata, not content, so it can be kept long enough for trend analysis and forensics.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class GuardrailDecision:
    timestamp_utc: str          # ISO 8601
    request_id: str             # joins to the model gateway's record for coverage checks
    route: str
    guardrail_stage: str        # e.g. "input_injection", "output_policy"
    decision: str               # "allow" | "block" | "escalate" | "error"
    score: float | None
    threshold: float | None
    config_version: str         # the exact guardrail config that made this decision
    model_version: str
    latency_ms: float
    is_probe: bool              # synthetic probe traffic, excluded from business metrics
    subject_pseudonym: str      # keyed HMAC of the user ID, never the raw ID
```

`config_version` and `model_version` on every record are what let you correlate a metric shift with a change ([7.3](/training/module/operations-and-governance/change-management)) and reconstruct what protection was in force at any moment during an incident ([7.2](/training/module/operations-and-governance/incident-response-and-disclosure)).

### The governed sample store

You need some real content. Reviewers cannot label a false negative they cannot read, judges cannot be calibrated without examples, and incident forensics often needs the actual exchange. "Never keep any content" leaves you blind; "log every prompt and response" builds a large, sensitive dataset that will outlive its purpose and become a breach target. Treat content as a separate, governed store with rules written down before the first record is written:

| Property | Rule (illustrative) |
|---|---|
| Purpose | Named purposes only: false negative review, false positive review, judge calibration, incident forensics. Not product analytics, not training, unless separately approved with a lawful basis ([7.5](/training/module/operations-and-governance/regulation-and-standards)). |
| Selection | Uniform random sample of allowed traffic (for unbiased FNR estimates), plus all blocked and escalated items up to a cap, plus items attached to user reports. Record the sampling rate so estimates can be weighted. |
| Redaction | Redact detected PII at write time, before storage ([3.5](/training/module/security-engineering/data-protection-and-isolation)). Redaction is probabilistic, so the store is still treated as sensitive. |
| Identity | Store a keyed HMAC pseudonym, with the key held in a secrets manager outside the store. An unkeyed hash such as `sha256(user_id)` or `sha256(prompt)` is not anonymization: anyone can hash candidate values and match them. See [3.5](/training/module/security-engineering/data-protection-and-isolation). |
| Access | A named reviewer group with role-based access, just-in-time grants for incident responders, and every read written to an audit log. No bulk export without approval. |
| Retention | Automatic deletion after 30 days. Items placed under an incident's legal hold are retained until the hold is released. |
| Location | A separate store from the general application logs, so that log access does not imply content access. |

This resolves the tension between privacy and reviewability: the decision log keeps metadata for everyone who operates the system, while a small, governed sample with a deletion date keeps content for the few people who need it.

```python
import hashlib
import hmac
import random


def pseudonymize(user_id: str, key: bytes) -> str:
    """Keyed pseudonym. Without the key, candidate IDs cannot be hashed and matched."""
    return hmac.new(key, user_id.encode("utf-8"), hashlib.sha256).hexdigest()


def should_sample(decision: str, allowed_sample_rate: float, rng: random.Random) -> bool:
    if not 0.0 <= allowed_sample_rate <= 1.0:
        raise ValueError("sample rate must be between 0 and 1")
    if decision in ("block", "escalate"):
        return True                       # capped downstream
    return rng.random() < allowed_sample_rate
```

Passing the `random.Random` instance in lets tests seed it. The record that `should_sample` admits is then passed through the PII redaction step from 3.5 before it is written.

### Dashboards for three audiences

| Audience | Question it answers | Contents |
|---|---|---|
| On-call | "Is anything broken right now, and where?" | Probe pass rate, coverage, block-rate ratio by route, error and timeout rate, p95 latency; each with baseline and alert state; links to runbooks |
| Guardrail owners | "Is the guardrail getting better or worse?" | Weekly estimated FNR and FPR from reviewed samples with confidence intervals ([6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)), block rate by category, top new bypass patterns, config and model versions over time, guardrail debt items |
| Leadership and risk owners | "Are we within the risk we accepted?" | Incidents by severity, open risk acceptances and their expiry dates ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)), trend of estimated FNR against the red line, cost |

Keep the on-call dashboard to one screen. If something needs scrolling to find during an incident, it is in the wrong place.

## Where it breaks

- **Probes test only what you already know.** A 100% probe pass rate says nothing about a new jailbreak. Probes also go stale if attackers learn them; keep the probe set private and rotate in new cases from red-team findings ([6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)).
- **Probes can take a different path.** If probe traffic is routed, cached, or authenticated differently from real traffic, a passing probe can hide a broken production path. Send probes through each real entry point.
- **Seasonal baselines adapt to slow drift.** A block rate that falls 5% a week never trips a ratio against last week. Also compare against a fixed reference period, such as the baseline recorded at the last release gate, and track the reviewed-sample FNR, which is measured against labels rather than against recent traffic.
- **Ratios mislead at low volume and low base rates.** Hence the minimum-volume floor. For rare categories, aggregate over longer windows rather than lowering the floor.
- **Block rate falls for good reasons too.** An attack campaign ending, or a product change that reduces abusive traffic, also lowers it. The page is still right: the on-call engineer checks probes and coverage and closes the alert in minutes if both are healthy.
- **Judges drift and can be attacked.** An LLM judge labeling the allowed sample has its own error rate and can be targeted by content written to fool it. Re-validate it against human labels on a schedule.
- **The sample store is itself a risk.** Redaction misses things, access groups grow, and retention jobs fail silently. Monitor the retention job and audit access to the store like any other sensitive system.
- **Monitoring alone does not stop anything.** It tells you something is wrong; at most it triggers an automated pause. Containment ([7.2](/training/module/operations-and-governance/incident-response-and-disclosure)) and the brake ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)) are what limit the damage.

## Lab exercise

In [Lab 7](/labs/lab-7-operate-and-respond), Task 7.1, you replay a week of guardrail decision logs that contain a hidden coverage gap, write relative-change alert rules and a coverage check, and show which rule fires first and at what ratio.

## Check your understanding

1. Your block rate is 3.0% at baseline and 1.4% today, with 20,000 requests in the window. Your old alert used a fixed band of 1% to 10%. What does the 7.1 rule set do, and why?
2. A teammate proposes storing `sha256(prompt)` for every request instead of keeping any content, calling it "anonymized." What is wrong with that claim, and what does the sample store do instead?
3. Probes pass at 100% and coverage is 100%, but users are reporting bypasses. What does this tell you, and which signal should you look at next?
4. Why does a falling block rate page while a rising one creates a ticket?

<details>
<summary>Answers</summary>

1. The ratio is 1.4 / 3.0 = 0.47, at or below 0.5x with well over 500 requests, so it pages. The fixed band hid a 53% relative drop because it judged the value against an absolute range instead of against its own baseline.
2. An unkeyed hash is not anonymization: anyone with a guess at the content (or a user ID) can hash it and match. It also gives reviewers nothing to read. The governed store keeps a small, PII-redacted, access-controlled, retention-limited sample of real content for named purposes, with identity held as a keyed HMAC pseudonym.
3. The known attacks are still blocked and all traffic is guarded, so the bypass is something the detectors do not recognize: a novel attack. Look at the reviewed allowed sample and the user reports to characterize it, add the cases to the probe set and regression suite, and treat it as an incident under 7.2.
4. A rise usually means more blocking, which hurts usability but keeps users protected. A fall can mean the guardrail stopped working and users are unprotected, which needs immediate investigation. A rise that coincides with probe failures or bypass signals should still be escalated.

</details>
