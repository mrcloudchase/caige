---
title: "Logging and Audit Trails"
slug: "logging-audit-trails"
module: "operations-observability"
moduleOrder: 6
sectionOrder: 2
description: "Section 2 of the operations observability module."
---

Logging for guardrail systems serves three purposes: real-time debugging, historical analysis, and compliance evidence.

### 6.2.1 What to Log

Every guardrail evaluation should produce a log entry containing:

| Field | Description | Example |
|-------|-------------|---------|
| `timestamp` | When the evaluation occurred | `2026-03-07T14:32:01.123Z` |
| `request_id` | Unique identifier for the request | `req_abc123def456` |
| `session_id` | Conversation/session identifier | `sess_xyz789` |
| `user_id` | Anonymized or hashed user identifier | `usr_hash_4f2a8b` |
| `guardrail_id` | Which guardrail evaluated the request | `gr_prompt_injection_v2` |
| `guardrail_version` | Version of the guardrail configuration | `2.3.1` |
| `evaluation_stage` | Input, output, or system-level | `input` |
| `decision` | Allow, block, modify, or escalate | `block` |
| `confidence` | How confident the guardrail is in its decision | `0.94` |
| `reason` | Why the decision was made | `injection_pattern_detected` |
| `categories` | Classification categories triggered | `["prompt_injection", "instruction_override"]` |
| `latency_ms` | Processing time in milliseconds | `23` |
| `input_hash` | Hash of the input (not the raw input) | `sha256_a1b2c3...` |
| `action_taken` | Specific action (refusal message ID, redaction applied, etc.) | `refusal_template_medical_v1` |
| `model_id` | Which AI model was being guarded | `gpt-4-2026-02` |
| `metadata` | Additional context (application, environment, region) | `{"app": "support_bot", "env": "prod", "region": "us-east"}` |

**Example log entry (JSON):**
```json
{
  "timestamp": "2026-03-07T14:32:01.123Z",
  "request_id": "req_abc123def456",
  "session_id": "sess_xyz789",
  "user_id": "usr_hash_4f2a8b",
  "guardrail_id": "gr_prompt_injection_v2",
  "guardrail_version": "2.3.1",
  "evaluation_stage": "input",
  "decision": "block",
  "confidence": 0.94,
  "reason": "injection_pattern_detected",
  "categories": ["prompt_injection", "instruction_override"],
  "latency_ms": 23,
  "input_hash": "sha256_a1b2c3d4e5f6...",
  "action_taken": "refusal_template_injection_v1",
  "model_id": "llm-production-v3",
  "metadata": {
    "app": "support_bot",
    "env": "prod",
    "region": "us-east"
  }
}
```

### 6.2.2 Privacy-Preserving Logging

Guardrail logs must capture enough information for debugging and audit without storing sensitive content:

**Technique 1: Input hashing**
Store a hash of the input rather than the raw text. This allows you to:
- Detect duplicate inputs (same hash = same input)
- Correlate related events across logs
- Verify input integrity if the raw input is available from another source
- Cannot be reversed to recover the original input

**Technique 2: Tiered logging**
Store different detail levels in different systems with different access controls:
- **Tier 1 (long-term, widely accessible):** Decision, reason, timestamp, guardrail ID — no content
- **Tier 2 (medium-term, restricted access):** Tier 1 + redacted content snippets, classification details
- **Tier 3 (short-term, highly restricted):** Full content for active investigations — auto-deleted after 72 hours

**Technique 3: Selective content logging**
Log only the specific text that triggered the guardrail, not the entire input:
- "Triggered by text: '***REDACTED*** ignore previous instructions ***REDACTED***'"
- Capture the trigger pattern without storing the surrounding context

**Technique 4: Differential privacy**
Add controlled noise to aggregate statistics so individual events cannot be identified:
- Useful for reporting ("block rate was approximately 3.2%") without exposing individual decisions
- Appropriate for dashboards and reports, not for debugging individual events

**Technique 5: Consent-gated logging**
For applications where users consent to detailed logging (e.g., beta testing):
- Store detailed logs only for consented users
- Use these logs for guardrail improvement and testing
- Delete when consent is withdrawn

| Technique | What It Preserves | Debugging Value | Compliance Fit | Trade-off |
|---|---|---|---|---|
| Input hashing | Hash for correlation, not content | Medium (can match, can't read) | GDPR-friendly | Cannot reconstruct original input |
| Tiered logging | Full content in restricted tier | High (with access controls) | Configurable | Operational complexity |
| Selective content | Only the triggering fragment | Medium-high | Good balance | May miss surrounding context |
| Differential privacy | Aggregate trends with noise | Low (individual) / High (trends) | Strong | Cannot investigate single events |
| Consent-gated | Full content for opted-in users | High (for consented subset) | GDPR-compliant | Limited coverage |

### 6.2.3 Log Retention Policies

Different regulations require different retention periods:

| Regulation | Typical Requirement |
|-----------|-------------------|
| EU AI Act | Logs for high-risk systems must be retained for the system's lifecycle or as specified |
| GDPR | Personal data logs must be deleted when no longer necessary; subject to right of erasure |
| SOC 2 | Typically 1 year of security event logs |
| HIPAA | 6 years for audit logs containing PHI-related events |
| PCI DSS | 1 year of audit trail history, 3 months immediately available |

**Best practices:**
- Define retention periods before building the logging system, not after
- Implement automated deletion (logs that should expire actually expire)
- Separate compliance logs from operational logs — they may have different retention requirements
- Plan storage costs based on retention requirements and log volume

### 6.2.4 Log Analysis and Forensics

When investigating a guardrail incident, log analysis follows a pattern:

**1. Identify the scope** — Which requests, users, time window are affected?
```
Query: All blocked requests for user_id=X between time T1 and T2
```

**2. Examine the sequence** — What happened before and after the incident?
```
Query: All guardrail events for session_id=Y, ordered by timestamp
```

**3. Look for patterns** — Is this an isolated event or part of a campaign?
```
Query: All requests with the same input_hash in the last 7 days
```

**4. Correlate with other systems** — What else was happening?
```
Query: Application logs, model logs, and infrastructure logs for the same time window
```

**5. Assess impact** — What was the actual damage?
```
Query: All requests that passed the guardrail during the failure window
```

---
