---
title: "Incident Response"
slug: "incident-response"
module: "operations-observability"
sectionOrder: 3
description: "Section 3 of the operations observability module."
---

When guardrails fail, you need a plan. AI guardrail incidents share some characteristics with traditional security incidents but have unique aspects.

### 6.3.1 AI-Specific Incident Response

AI guardrail incidents differ from traditional security incidents in several ways:

- **Non-deterministic reproduction** — The same input may not reproduce the same failure, making investigation harder
- **Unclear boundaries** — "Harmful output" is often subjective, making severity assessment more nuanced
- **Model involvement** — The model's behavior may have changed due to an update, making root cause analysis harder
- **Content sensitivity** — Incident evidence may contain harmful content that itself needs careful handling
- **Rapid evolution** — New attack techniques emerge frequently, and yesterday's guardrails may not address today's attacks

**Standard AI guardrail incident response procedure:**

1. **Detect** — Monitoring alert, user report, or internal audit discovers the issue
2. **Triage** — Determine severity and assign an incident commander
3. **Contain** — Take immediate action to stop ongoing harm
4. **Investigate** — Determine root cause and scope of impact
5. **Remediate** — Fix the guardrail gap
6. **Recover** — Restore normal operations and verify the fix
7. **Review** — Conduct a post-incident review and update processes

```
Incident response workflow:

[Detect] → [Triage] → [Contain] → [Investigate] → [Remediate] → [Recover] → [Review]
              |                         |                                        |
              v                         v                                        v
         Assign severity          Root cause unclear?                    Feed findings back
         (SEV-1/2/3/4)           → return to Contain                   into guardrail updates
```

### 6.3.2 Severity Classification

| Severity | Criteria | Example | Response Time |
|----------|----------|---------|---------------|
| SEV-1 | Active data exposure, guardrails completely bypassed, harmful content reaching users at scale | PII of multiple users leaked in AI responses; complete guardrail system failure | Immediate (within 15 minutes) |
| SEV-2 | Guardrail partially bypassed, limited harmful content reaching users, single-user data exposure | A specific jailbreak technique consistently bypasses the safety classifier | Within 1 hour |
| SEV-3 | Guardrail misconfiguration causing excessive false positives, minor guardrail gap discovered in testing | New prompt injection technique works but requires impractical effort; block rate doubled after deployment | Within 4 hours |
| SEV-4 | Guardrail performance degradation, minor metric anomalies, cosmetic issues in refusal messages | Guardrail latency increased by 50ms; refusal message has a typo | Within 1 business day |

### 6.3.3 Containment Strategies

Containment actions, ordered from least disruptive to most disruptive:

1. **Block specific inputs** — If the attack uses a known pattern, add it to the blocklist immediately
2. **Increase guardrail sensitivity** — Lower classification thresholds to catch more (accepting more false positives temporarily)
3. **Enable additional guardrails** — Turn on guardrails that were disabled for performance (e.g., LLM-as-judge on every request)
4. **Rate limit affected endpoints** — Reduce the rate of requests to slow the attack
5. **Require human review** — Route all requests through human review (only sustainable short-term)
6. **Disable specific features** — Turn off the feature that is being exploited
7. **Block specific users/IPs** — If the attack is coming from identifiable sources
8. **Roll back recent changes** — If the incident was caused by a recent guardrail or model change
9. **Take the AI system offline** — Last resort, when continued operation causes more harm than downtime

The right containment action depends on severity, scope, and the specific failure mode. For SEV-1 incidents, err on the side of more aggressive containment.

```
Containment escalation (least → most disruptive):

  Block specific inputs          ← Targeted, minimal impact
  Increase guardrail sensitivity ← Broader, may increase false positives
  Enable additional guardrails   ← More coverage, adds latency
  Rate limit affected endpoints  ← Slows everyone on that endpoint
  Require human review           ← Adds delay for all requests
  Disable affected features      ← Feature unavailable
  Block suspicious users/IPs     ← Blocks legitimate users if wrong
  Roll back recent changes       ← Reverts good changes too
  Take system offline            ← Full outage — last resort
```

### 6.3.4 Communication

**Internal communication:**

Incident notification should include:
- What happened (brief description)
- Current severity level
- Current impact (users affected, data exposed)
- Containment actions taken
- Next steps and expected timeline
- Who is the incident commander

Template:
```
SUBJECT: [SEV-X] AI Guardrail Incident - [Brief Description]

WHAT: [Description of what happened]
IMPACT: [Who/what is affected]
STATUS: [Contained/Active/Investigating]
ACTIONS TAKEN: [Containment steps completed]
NEXT STEPS: [What happens next]
COMMANDER: [Name and contact]
UPDATES: [Where to find updates - Slack channel, incident page, etc.]
```

**External communication (if required):**

External communication may be necessary when:
- User data was exposed (privacy notification requirements)
- The incident is publicly visible
- Regulatory notification is required
- Customers need to take protective action

External communication should:
- Be factual and avoid speculation
- Describe what happened and what you're doing about it
- Not reveal guardrail implementation details that could aid attackers
- Be reviewed by legal before publication
- Include contact information for questions

### 6.3.5 Post-Incident Review

After the incident is resolved, conduct a blameless post-incident review:

**Structure:**
1. **Timeline** — What happened and when, in chronological order
2. **Impact assessment** — Final determination of who/what was affected
3. **Root cause analysis** — Why did the guardrail fail? Distinguish between:
   - **Shallow cause:** "The classifier didn't catch this encoding"
   - **Deep cause:** "We don't test guardrails against encoded inputs because our test suite doesn't include encoding variations"
4. **What went well** — What detection, containment, or communication worked
5. **What could be improved** — What would have reduced time to detect, contain, or resolve
6. **Action items** — Specific, assigned, time-bounded improvements:
   - Guardrail fixes
   - Test suite additions
   - Monitoring improvements
   - Process changes
   - Documentation updates

### 6.3.6 Escalation Paths

Know when to involve other teams:

![Escalation paths](/svg/escalation-paths.svg)

| Trigger | Escalate To | Why |
|---------|------------|-----|
| PII or sensitive data exposed | Privacy/Legal team | Regulatory notification requirements, legal liability |
| Active attack campaign | Security team | Attacker attribution, broader infrastructure assessment |
| User data cross-contamination | Privacy team + Engineering leadership | Data breach notification, architecture review |
| Harmful content reached users at scale | PR/Communications + Legal | Public communication, reputation management |
| Guardrail system completely down | Engineering leadership + On-call infrastructure | Resource allocation, platform-level investigation |
| Regulatory compliance violated | Legal + Compliance | Regulatory notification, documentation |
| Brand/reputation impact | PR/Communications + Product leadership | External messaging, product decisions |
| Financial impact (SLA breach, customer churn) | Product + Business leadership | Business decisions, customer communication |

---
