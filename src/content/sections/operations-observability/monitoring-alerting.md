---
title: "Monitoring and Alerting"
slug: "monitoring-alerting"
module: "operations-observability"
moduleOrder: 6
sectionOrder: 1
description: "Section 1 of the operations observability module."
---

Guardrails that run in production without monitoring are guardrails you hope are working. Monitoring turns hope into evidence.

### 6.1.1 Key Metrics for Guardrail Systems

Guardrail monitoring requires tracking four categories of metrics:

**Safety metrics** — Is the guardrail doing its job?

| Metric | What It Measures | Why It Matters |
|--------|-----------------|----------------|
| Block rate | Percentage of requests blocked by guardrails | Sudden changes indicate either new attack patterns or guardrail misconfiguration |
| Pass rate | Percentage of requests allowed through | The inverse of block rate — useful for spotting false positive spikes |
| Bypass rate | Known harmful requests that pass through undetected | Directly measures guardrail effectiveness — this is your most critical safety metric |
| Escalation rate | Requests escalated to human review | Rising rates may indicate the guardrail is uncertain or undertrained |
| Category distribution | Breakdown of blocks by guardrail type (injection, toxicity, PII, etc.) | Identifies which threats are most active |

**Performance metrics** — Is the guardrail fast enough?

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| Latency p50 | Median guardrail processing time | Application-dependent, typically < 100ms |
| Latency p95 | 95th percentile processing time | Should not significantly degrade user experience |
| Latency p99 | 99th percentile processing time | Watch for tail latency spikes |
| Throughput | Requests processed per second | Must scale with application traffic |
| Error rate | Guardrail system errors (not policy blocks, but system failures) | Should be near zero — a crashing guardrail is worse than no guardrail |

**Operational metrics** — Is the guardrail system healthy?

| Metric | What It Measures |
|--------|-----------------|
| Uptime / availability | Percentage of time the guardrail system is operational |
| Queue depth | Backlog of requests waiting for guardrail processing (if async) |
| Resource utilization | CPU, memory, GPU usage of guardrail components |
| Dependency health | Status of external services guardrails depend on (classifiers, APIs) |
| Configuration version | Which guardrail configuration is currently deployed |

**Business-impact metrics** — How do guardrails affect the user experience?

| Metric | What It Measures |
|--------|-----------------|
| User complaint rate | Complaints related to blocked or modified content |
| False positive review rate | Rate of guardrail blocks overturned on review |
| Session abandonment after block | Users who leave after a guardrail intervention |
| Support tickets from guardrail actions | Customer support burden created by guardrails |

### 6.1.2 Anomaly Detection

Beyond tracking metrics, you need to detect when metrics deviate from normal patterns:

**What to detect:**

- **Sudden spike in block rate** — Could indicate: a new attack campaign, a guardrail misconfiguration after deployment, or a change in user behavior
- **Sudden drop in block rate** — Could indicate: a guardrail failure (not running), a model change that bypasses the guardrail, or a decrease in attack activity
- **Latency spike** — Could indicate: a downstream dependency issue, resource exhaustion, or a new guardrail rule that is computationally expensive
- **New category of blocks appearing** — Could indicate: a new attack pattern or a guardrail update catching previously-missed content
- **Block rate divergence across regions or user segments** — Could indicate: targeted attacks, bias in guardrail behavior, or regional content differences

**Detection approaches:**

- **Static thresholds** — Alert when a metric exceeds a fixed value (e.g., block rate > 20%). Simple, but doesn't account for normal variation.
- **Dynamic thresholds** — Alert when a metric deviates from its rolling average by more than N standard deviations. Adapts to normal patterns.
- **Rate-of-change alerts** — Alert when a metric changes faster than expected (e.g., block rate doubles within 5 minutes). Catches sudden shifts.
- **Comparative alerts** — Alert when one segment differs significantly from others (e.g., block rate for one API key is 10x higher than average). Catches targeted attacks.

### 6.1.3 Alert Design

Not every anomaly is an emergency. Alert design prevents alert fatigue while ensuring critical issues get attention.

**Alert severity tiers:**

**P1 — Page the on-call engineer immediately:**
- Guardrail system is completely down (no requests being processed)
- Bypass rate exceeds critical threshold (harmful content is getting through)
- PII leakage detected in production output
- Active attack campaign detected (coordinated injection attempts)

**P2 — Create an urgent ticket, respond within 1 hour:**
- Guardrail latency exceeds SLA thresholds
- Block rate anomaly detected (significant deviation from baseline)
- Guardrail dependency is degraded but not down
- Elevated error rate in guardrail processing

**P3 — Create a ticket, respond within 1 business day:**
- Gradual drift in guardrail metrics
- False positive rate trending upward
- Resource utilization approaching capacity limits
- New attack patterns detected but currently blocked

**P4 — Log for review in weekly operations review:**
- Minor metric fluctuations within normal range
- Successful guardrail deployments
- Routine configuration changes
- Low-priority anomalies that self-resolved

**Alert design principles:**
- Every alert must have a documented runbook (what to do when it fires)
- Alerts that fire frequently without requiring action should be tuned or removed
- Group related alerts to prevent alert storms
- Include context in the alert: what happened, what the normal value is, what the current value is, and a link to the runbook

### 6.1.4 Dashboard Design

A guardrail operations dashboard should answer these questions at a glance:

**Top-level health:**
- Are all guardrail systems operational? (Green/yellow/red status)
- What is the current block rate vs. the 7-day average?
- Are there any active alerts?

**Detailed view per guardrail type:**
- Block rate over time (last 24h, 7d, 30d)
- Latency percentiles over time
- Top reasons for blocks (category breakdown)
- False positive rate (if review data is available)

**Attack and threat view:**
- Prompt injection detection rate over time
- New attack patterns identified
- Block rate by user segment or API key
- Geographic distribution of blocks

**Operational view:**
- Resource utilization trends
- Dependency health status
- Configuration version and last deployment
- Recent changes and their impact on metrics

### 6.1.5 Correlating Guardrail Events with System Behavior

Guardrail events do not exist in isolation. Correlate them with:

- **Model updates** — Did a new model version change what the guardrail catches? A model update that changes output patterns may require guardrail re-tuning.
- **Traffic patterns** — Do block rates follow usage patterns? Higher block rates during off-hours might indicate automated attacks.
- **Application deployments** — Did a code change affect how inputs reach the guardrail or how outputs are processed?
- **Upstream changes** — Did a change in data sources, retrieval indices, or tool integrations affect guardrail behavior?
- **External events** — Do block patterns correlate with world events, news cycles, or social media trends?

---
