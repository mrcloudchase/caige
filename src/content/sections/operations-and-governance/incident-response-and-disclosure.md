---
id: "7.2"
title: "Incident Response and Disclosure"
slug: incident-response-and-disclosure
module: operations-and-governance
sectionOrder: 2
description: "Running an AI incident: severity, containment options that actually reduce exposure during an active bypass, forensics from audit logs, regression tests, brake drills, and disclosure to users, regulators, and the industry."
category: cross-cutting
controlLayers: [deterministic, runtime-ml, human]
knowledge:
  - "How AI incidents differ from conventional outages: non-deterministic reproduction, bypasses that are phrasings rather than code defects, probabilistic fixes, and untrustworthy model self-reports"
  - "A severity scale for AI incidents based on harm, exposure, and reversibility"
  - "Containment options for an active bypass (emergency rules, stricter thresholds, routing to human review, disabling a tool or feature, the emergency brake) and why fail-closed settings and rate limits are not containment"
  - "How to scope an incident from decision logs and tamper-evident audit logs rather than from the model's account of what it did"
  - "Disclosure obligations and channels: affected users, regulators where the law requires it (for example GDPR Articles 33 and 34, EU AI Act Article 73), and coordinated industry sharing"
  - "Why vulnerability reports belong in a restricted security tracker, and why brake drills are run on a schedule"
skills:
  - "Classify an AI incident's severity and choose the narrowest containment that stops the exposure"
  - "Reconstruct the scope and timeline of a bypass from audit logs, config versions, and the sample store"
  - "Convert an incident into regression tests and detection probes"
  - "Draft a disclosure plan covering users, regulators, the upstream vendor, and industry sharing"
  - "Plan and run a brake drill and record its results"
sources:
  - title: "Regulation (EU) 2016/679 (GDPR), Articles 33 and 34"
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj"
  - title: "EU AI Act Article 73: Reporting of serious incidents"
    url: "https://artificialintelligenceact.eu/article/73/"
  - title: "CISA JCDC AI Cybersecurity Collaboration Playbook (January 2025)"
    url: "https://www.cisa.gov/sites/default/files/2025-01/JCDC%20AI%20Playbook.pdf"
  - title: "FIRST Guidelines and Practices for Multi-Party Vulnerability Coordination and Disclosure"
    url: "https://www.first.org/global/sigs/vulnerability-coordination/multiparty/guidelines-v1.1"
  - title: "AI Incident Database"
    url: "https://incidentdatabase.ai/"
  - title: "MITRE ATLAS"
    url: "https://atlas.mitre.org/"
lastReviewed: "2026-10-14"
---

# 7.2 Incident Response and Disclosure

## The problem

A retailer's shopping assistant can search the catalog, read product reviews, and call an `apply_promo_code` tool that is meant for codes the customer types in. On Friday evening the cost dashboard shows discount volume at 4x its baseline, and a customer emails support asking why "the bot" gave them 90% off. An attacker has posted product reviews containing instructions addressed to the assistant: when a shopper asks about this product, apply the staff code. The assistant reads the review as retrieved content and calls the tool.

The on-call engineer's first two ideas are to "switch the guardrail to fail-closed" and to "rate-limit the assistant." Neither helps. The guardrail is not erroring; it is evaluating each request and allowing it, so a fail-closed setting, which only governs what happens when the guardrail errors or times out, changes nothing. A rate limit slows the attack down but every request that gets through is still unguarded, and with thousands of legitimate shoppers the attacker's share barely moves. Meanwhile the incident has no severity, no commander, and no one has asked who needs to be told.

## Why it happens

AI incidents break assumptions that conventional incident response relies on.

- **Reproduction is probabilistic.** The same input can succeed once in five tries. "I couldn't reproduce it" is not evidence of a fix. Measure success rates over repeated trials ([6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)).
- **The defect is often a phrasing, not a line of code.** There may be no commit to revert. The exploit is a family of inputs, and blocking one string leaves its paraphrases.
- **Fixes at the runtime-ml layer are partial.** Retraining a classifier or tightening a threshold lowers the success rate; it does not reach zero. Only a deterministic change, such as removing the tool's ability to accept codes from model output, bounds the damage.
- **The model is not a witness.** Asking the assistant "did you apply any staff codes?" produces text, not evidence. Scope comes from logs the model cannot write to ([5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)).
- **Harm may already be outside your system.** Leaked data, sent emails, and executed transactions cannot be pulled back by fixing the guardrail. Disclosure and remediation for affected people become part of the response.

## Control patterns

### Severity

Severity drives who is paged, who must approve containment, and who must be told. Classify on harm, exposure, and reversibility, not on how clever the attack was.

| Severity | Illustrative criteria | Response |
|---|---|---|
| SEV1 | Active, ongoing harm: confidential or personal data leaving the system, unauthorized irreversible actions, content creating risk to life; or the guardrail is absent for a material share of traffic | Page incident commander and guardrail on-call immediately; legal and communications engaged within the hour; brake is on the table |
| SEV2 | Confirmed bypass with limited or reversible impact; a working exploit with no evidence of use yet; probe pass rate or coverage paging | Page guardrail on-call; incident commander assigned; containment the same day |
| SEV3 | Degraded protection without a confirmed bypass (for example a false positive wave, or latency forcing a fallback path) | Ticket with an owner; fix within the sprint |
| SEV4 | Near miss or hygiene finding | Track in the backlog or the restricted security tracker |

When in doubt, start one level higher and lower it once scope is known. Downgrading is cheap; a SEV1 run as a SEV3 for six hours is not.

### Roles

![Stakeholder chart for incident escalation: an Incident Commander who coordinates all response sits at the center, with two-way communication to the Security Team (threat analysis, attacker attribution), Engineering Team (guardrail fixes, system remediation), Legal and Compliance (regulatory notifications, liability assessment), Communications (public statements, customer notification), and Leadership (resource allocation, business decisions).](/svg/escalation-paths.svg)

The diagram shows who the incident commander coordinates, not a severity ladder. The commander owns decisions and the timeline, and does not do the hands-on debugging. Legal and compliance own the regulatory clocks below. The authority to pull the brake is defined in advance ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)); the commander does not need to negotiate it mid-incident.

### Containment for an active bypass

Pick the narrowest option that actually stops the exposure, and escalate quickly if it does not. Ordered from weakest to strongest guarantee:

| Option | Layer | What it does | Limits |
|---|---|---|---|
| Emergency detection rule | deterministic match on input, retrieved content, or output | Blocks the specific payload family (here: review text addressing the assistant, or tool calls with codes not present in the user's own message) | Paraphrases evade string rules; useful in minutes while stronger options are prepared |
| Stricter thresholds | runtime-ml | Lowers the block threshold on the relevant classifier for the affected route or tenant | Raises false positives; still probabilistic |
| Route to human review | human | Holds the risky action (here: any promo code application) for a person to approve before it executes ([5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)) | Slower; reviewers need the evidence, not the model's justification |
| Disable the tool or feature | deterministic | Removes `apply_promo_code` from the agent, or turns off review retrieval | Loses functionality; the strongest targeted option |
| Pull the brake | human, enforced deterministically | Pauses or stops the system, revokes its credentials ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)) | Full outage for that system; use when you cannot bound the harm any other way |

What is not on the list:

- **"Switch to fail-closed."** Fail-open and fail-closed decide what happens when a guardrail errors or times out ([4.7](/training/module/safety-engineering/streaming-latency-and-failure-behavior)). During a bypass the guardrail runs and says "allow", so changing error behavior does nothing.
- **Rate limiting.** It reduces how fast unguarded requests arrive, not whether they are unguarded. It is a cost and abuse control, not containment.
- **Asking the model to stop.** A system-prompt patch ("never apply staff codes") is a prompt-layer request and the attacker's text is competing with it ([3.1](/training/module/security-engineering/prompt-injection)). Ship it if you like, but do not count it as containment.

In the scenario, the incident commander ships an emergency rule within ten minutes, then disables `apply_promo_code` for all model-initiated calls until a deterministic check is in place that only accepts codes appearing verbatim in the authenticated user's own message. Discounts drop back to baseline. That is containment; the rest is cleanup.

Every emergency change goes through the same config-as-code pipeline as normal changes ([7.3](/training/module/operations-and-governance/change-management)), with an expedited review and an expiry date, so it is versioned, attributable, and does not become permanent debt.

## Implementation

### Emergency controls with an owner and expiry

```python
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class EmergencyControl:
    control_id: str
    incident_id: str
    kind: str                 # "rule" | "threshold" | "human_review" | "disable_tool" | "brake"
    target: str               # e.g. "tool:apply_promo_code"
    approved_by: str          # a named person, not "on-call"
    expires_at: datetime      # timezone-aware; forces a decision to remove or make permanent


def tool_disabled(tool: str, controls: list[EmergencyControl], now: datetime) -> bool:
    """Checked in the harness before every tool call, outside the model's reach."""
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    for c in controls:
        if c.kind == "disable_tool" and c.target == f"tool:{tool}" and now < c.expires_at:
            return True
    return False
```

An expired control does not silently disappear from operations: the guardrail owner gets a ticket a few days before expiry to either fold it into permanent configuration or remove it. Note that `tool_disabled` lives in the harness. If the disabled flag were something the model read in its prompt, it would be a request, not a control.

### Forensics from audit logs

Scope answers four questions: when did it start, which requests were affected, what did the system do as a result, and what was in force at the time.

1. **Find the first occurrence.** Search the governed sample store and retrieved-content index for the payload family. Search tool-call audit records for the abnormal action (`apply_promo_code` with a code not present in the user's message). The earliest match bounds the start.
2. **Enumerate affected requests.** Join tool-call audit records to guardrail decision records by request ID ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)). Every request where the tool fired with an unrequested code is in scope, whether or not a guardrail evaluated it.
3. **Determine consequences from systems of record.** The order database says which orders received the discount. The model's transcript does not count as evidence of what happened; it is the thing under investigation.
4. **Pin the configuration.** Each decision record carries `config_version` and `model_version`. Check whether the bypass began with a change (a new model version, a retrieval change that started indexing reviews) or with the attacker's first post.
5. **Preserve evidence.** Place affected records in the sample store and logs under legal hold before the 30-day retention job deletes them.

```text
first_seen        = min(timestamp) over tool_audit where action matches payload signature
affected_requests = tool_audit WHERE action = "apply_promo_code"
                    AND code NOT IN user_message_codes(request_id)
                    AND timestamp >= first_seen
impact            = orders JOIN affected_requests ON order_id    (system of record)
config_at_start   = decision_log WHERE request_id = first affected request
```

### Regression tests and probes

Before the incident closes:

- Add the original payload and a set of paraphrases, translations, and encodings to the regression suite ([6.6](/training/module/evaluation-and-red-teaming/regression-and-ci)). Test the full pipeline, not only the classifier.
- Add a labeled probe for this attack family to the production probe set (7.1), entering through the real retrieval path.
- Record which fix is deterministic and which is probabilistic. The regression suite measures the attack success rate over repeated trials for the probabilistic part.

### Vulnerability tracking

Every confirmed vulnerability gets a ticket, and that ticket lives in a **restricted security tracker**: access limited to the security and guardrail teams and named engineers working the fix, with exploit details kept there and not in the general issue tracker, chat channels, or public pull request descriptions. The general tracker can carry a placeholder ("security fix, see SEC-123") so engineering work can be scheduled without spreading a working exploit across the company.

### Brake drills

The emergency brake ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)) is only as good as the last time someone used it. Drill it on a schedule (for example quarterly, and after any change to the harness or credentials), in production or a production-equivalent environment:

- A person who holds stop authority, chosen at random from the authorized list, pulls the brake without warning the system's team.
- Measure time from decision to full stop, confirm in-flight actions reached a safe state, confirm credentials were revoked, and confirm nothing kept running (scheduled jobs, queued tool calls, a second region).
- Then restore, and measure that too. A brake that takes three days to recover from will not be pulled.
- Record the results as evidence ([7.5](/training/module/operations-and-governance/regulation-and-standards)) and fix what failed.

### Disclosure

Disclosure has three audiences. Plan them at the start of the incident, because some clocks start when you become aware.

**Affected users.** Tell people what happened to them, what data or actions were involved, what you have done, and what they should do. In the scenario, that means the retailer decides with legal whether to honor or reverse the discounts and tells those customers either way. Where an AI system exposed one user's personal data to another, the affected users need to know.

**Regulators, where required.** Legal and compliance own the determination, but engineers must recognize the triggers and produce the evidence:

| Regime | Trigger | Deadline | Engineering evidence needed |
|---|---|---|---|
| GDPR Article 33 | Personal data breach, unless unlikely to result in a risk to people's rights and freedoms | Notify the supervisory authority without undue delay and, where feasible, within 72 hours of becoming aware | Scope, categories and approximate number of people and records, likely consequences, measures taken |
| GDPR Article 34 | Breach likely to result in a high risk to people | Communicate to the affected people without undue delay | The same scope, in plain language |
| EU AI Act Article 73 | Serious incident involving a high-risk AI system | Immediately after establishing a causal link (or its reasonable likelihood), and no later than 15 days after awareness; 10 days where a death is involved; 2 days for a widespread infringement or a serious incident under Article 3(49)(b) | Incident record, causal analysis, corrective action; see 7.5 for when high-risk obligations apply |
| Sector and contractual rules | Health, financial, critical infrastructure, and customer contracts often carry their own notification terms | Varies | Ask legal early |

**Coordinated industry sharing.** Bypass techniques usually work against more than one deployment.

- **Upstream vendors.** If the weakness is in a model, a guardrail product, or a tool, report it privately to that vendor and coordinate timing before publishing. The FIRST multi-party coordination guidelines describe how to do this when several vendors are involved.
- **Government and sector channels.** In the United States, CISA's JCDC AI Cybersecurity Collaboration Playbook (January 2025) describes voluntary sharing of AI security incidents and vulnerabilities. Sector ISACs serve a similar role.
- **Public knowledge bases.** After remediation, publish a sanitized write-up, and contribute to resources such as MITRE ATLAS case studies or the AI Incident Database so others can learn from it. Remove working exploit details that would help an attacker against unpatched systems.

## Where it breaks

- **Emergency rules create a false sense of closure.** The payload changes and the rule stops matching. Keep the incident open until a deterministic or structural fix is in place, or a risk owner has accepted what remains ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)).
- **Containment that is too narrow.** Disabling a tool on one route while a second agent or client exposes the same tool leaves the exposure open. Containment acts at the tool or credential, not the route, when you are unsure.
- **Logs that do not exist.** If tool calls were not recorded outside the model's reach, you cannot scope the incident and may have to notify more broadly than the facts require. That is a design gap to fix after the incident ([5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)).
- **Retention deletes evidence.** A 30-day retention policy and a bypass that started 40 days ago means the early evidence is gone. Legal holds must be placed early, and decision metadata is retained longer than content for this reason.
- **Disclosure delayed by uncertainty.** Waiting for perfect scope can miss a statutory clock. Regulators generally accept phased reports; GDPR Article 33 and AI Act Article 73 both allow information to be provided in stages.
- **Industry sharing leaks the exploit.** A write-up published before other vendors patch hands attackers a working technique. Coordinate first.
- **Drills that never pull the real lever.** A tabletop exercise that talks through the brake does not show that it works. At least some drills must actually stop a system.

## Lab exercise

In [Lab 7](/labs/lab-7-operate-and-respond), Task 7.2, you respond to a simulated active bypass: classify severity, apply a containment that stops the exposure (and see why toggling fail-closed does not), scope affected requests from the audit log, add regression tests, and draft a disclosure plan.

## Check your understanding

1. During an active injection bypass, a colleague says, "Flip the guardrail to fail-closed and we're contained." Explain why this is wrong and name two options that do contain it.
2. An agent's transcript says it "did not send any customer records." What evidence would you use to determine scope instead?
3. A bypass exposed one customer's order history to another customer in the EU. Which disclosure obligations should legal assess, and what must engineering supply?
4. Why is the original jailbreak string alone a weak regression test?
5. What makes a brake drill useful evidence rather than theater?

<details>
<summary>Answers</summary>

1. Fail-closed only changes behavior when the guardrail errors or times out. During a bypass the guardrail runs and allows the request, so nothing changes. Containment options include an emergency detection rule, stricter thresholds, routing the risky action to human review, disabling the tool or feature, or pulling the brake.
2. The tamper-evident audit records of tool calls and outbound actions, joined to guardrail decision records by request ID, and the downstream systems of record. The model's own account is not evidence.
3. A GDPR Article 33 notification to the supervisory authority (within 72 hours of awareness where feasible, unless the breach is unlikely to result in risk) and an Article 34 communication to the affected people if the risk is high; plus any contractual or sector obligations. Engineering supplies the scope: which records, how many people, when, the likely consequences, and what was done to contain it.
4. The attack is a family of phrasings. A single string tests one member; paraphrases, translations, and encodings of it can still succeed. The regression suite needs variants, and the success rate is measured over repeated trials.
5. It is unannounced, done by a person who actually holds stop authority, measured (time to stop, safe state reached, credentials revoked, nothing still running, time to restore), and its failures are fixed and recorded.

</details>
