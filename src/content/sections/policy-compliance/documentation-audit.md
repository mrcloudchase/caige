---
title: "Documentation and Audit"
slug: "documentation-audit"
module: "policy-compliance"
sectionOrder: 3
description: "Section 3 of the policy compliance module."
---

Guardrails that cannot be demonstrated to auditors might as well not exist. Documentation is not bureaucracy — it is proof that your organization is managing AI risk.

### 4.3.1 What to Document

**Guardrail documentation serves multiple audiences:**

For **auditors and regulators:**
- What guardrails are in place
- What risks each guardrail mitigates
- Evidence that guardrails are working (metrics, test results)
- Incident history and response actions

For **engineering teams:**
- How guardrails are implemented (architecture, code, configuration)
- How to modify and update guardrails
- How to test guardrails
- Runbooks for guardrail incidents

For **leadership:**
- Overall guardrail effectiveness (high-level metrics)
- Risk posture (what's covered, what gaps remain)
- Resource requirements (cost, headcount)
- Incident summaries

| Audience | What They Need | Format | Update Frequency |
|---|---|---|---|
| Auditors / Regulators | Compliance evidence, decision trails, policies | Formal reports, audit logs | Per audit cycle |
| Engineering Teams | Implementation details, schemas, thresholds | Technical docs, runbooks | Every change |
| Leadership | Risk posture, incident summaries, resource needs | Dashboards, executive briefs | Monthly/quarterly |

### 4.3.2 Model Cards and System Cards

**Model cards** are standardized documents that describe a machine learning model:
- Model architecture and training data summary
- Intended uses and out-of-scope uses
- Performance metrics across different demographics and conditions
- Known limitations and failure modes
- Ethical considerations

**System cards** extend model cards to describe the full application:
- System architecture (how the model is integrated)
- Guardrails applied (input, output, system-level)
- Data flows and access controls
- Human oversight provisions
- Testing and evaluation results
- Incident response procedures

For guardrail engineers, system cards are the more relevant document. A system card should clearly describe:
- Each guardrail and what it protects against
- How each guardrail was tested and its effectiveness metrics
- What happens when a guardrail triggers (user experience)
- Known gaps or limitations in guardrail coverage

### 4.3.3 Audit Trail Requirements

An audit trail for guardrails should capture:

**Per-request audit data:**
- Timestamp
- User identifier (hashed/anonymized if needed)
- Guardrail triggered (which one)
- Guardrail decision (allow, block, modify, escalate)
- Reason for decision (what triggered it — classification result, rule match, etc.)
- Latency added by guardrail processing

**Aggregate audit data:**
- Guardrail trigger rates over time
- False positive/negative rates (from review of flagged items)
- Performance metrics (latency percentiles)
- Incident counts and severity

**What NOT to include in audit trails:**
- Raw user input containing PII (use hashed or redacted versions)
- Full model outputs that may contain sensitive generated content
- Internal system prompt text (reference by version, don't embed)

| Data Category | Per-Request | Aggregate | Never Log |
|---|---|---|---|
| Timestamps, request IDs | ✓ | | |
| Guardrail triggered, decision, reason | ✓ | | |
| Latency per guardrail | ✓ | ✓ (percentiles) | |
| Block rates, false positive rates | | ✓ | |
| Raw user input content | | | ✓ |
| Full model output text | | | ✓ |
| System prompt text | | | ✓ |

### 4.3.4 Change Management

Every guardrail change should be tracked:

- **What changed** — Description of the modification
- **Why it changed** — Policy change, incident response, tuning, or new threat
- **Who approved it** — Change approver (may require multi-party approval for critical guardrails)
- **When it was deployed** — Timestamp and deployment mechanism
- **Testing evidence** — Results of testing the change before deployment
- **Rollback plan** — How to revert if the change causes problems

### 4.3.5 Incident Documentation

When a guardrail fails, document:

1. **Detection** — How was the failure discovered? (Monitoring, user report, audit review)
2. **Description** — What happened? What guardrail failed and how?
3. **Impact** — Who was affected? What was the severity?
4. **Timeline** — When did the failure start, when was it detected, when was it contained?
5. **Root cause** — Why did the guardrail fail?
6. **Remediation** — What was done to fix it?
7. **Prevention** — What changes prevent recurrence?
8. **Lessons learned** — What should the team do differently?

### 4.3.6 Risk Registers

A risk register maps identified risks to their mitigations:

| Risk ID | Description | Likelihood | Impact | Risk Level | Mitigation (Guardrail) | Residual Risk | Owner |
|---------|------------|-----------|--------|-----------|----------------------|--------------|-------|
| R-001 | Prompt injection bypasses safety instructions | High | High | Critical | Input validation + output verification + LLM-as-judge | Medium | Security team |
| R-002 | PII leaked in AI responses | Medium | High | High | PII detection + redaction + data minimization | Low | Privacy team |
| R-003 | Off-topic responses to customer queries | High | Low | Medium | Topic classifier + system prompt | Low | Product team |

The risk register connects guardrails to business risks, making it clear why each guardrail exists and what happens without it.

---
