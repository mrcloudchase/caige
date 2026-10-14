---
id: "7.4"
title: "Release Gates and Documentation"
slug: release-gates-and-documentation
module: operations-and-governance
sectionOrder: 4
description: "Go/no-go criteria for AI releases, system cards, risk acceptance records with named owners, and documented authority to stop a launch or a running system."
category: cross-cutting
controlLayers: [human, deterministic]
knowledge:
  - "The difference between blocking and advisory release criteria, and why criteria are fixed before the evaluation is run"
  - "What a system card contains and who reads it"
  - "The fields of a risk acceptance record, and why the signer must be the person who owns the business consequence"
  - "The two kinds of stop authority (blocking a launch and stopping a running system), who holds each, and how an override is recorded"
  - "Why stopping should be easy and resuming should be harder"
  - "How the EU AI Act's human oversight requirement for high-risk systems (Article 14) relates to stop authority"
skills:
  - "Write go/no-go criteria for an AI release, including evidence requirements for each criterion"
  - "Implement a release gate that fails when evidence is missing or a waiver is unsigned or expired"
  - "Draft a system card and a risk acceptance record for a real system"
  - "Document a stop authority register with named holders, deputies, invocation paths, and override rules"
sources:
  - title: "Model Cards for Model Reporting (Mitchell et al., 2019)"
    url: "https://arxiv.org/abs/1810.03993"
  - title: "NIST AI 100-1: Artificial Intelligence Risk Management Framework (AI RMF 1.0), January 2023"
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
  - title: "EU AI Act Article 14: Human oversight"
    url: "https://artificialintelligenceact.eu/article/14/"
  - title: "Regulation (EU) 2026/1744 (Digital Omnibus on AI), amending Regulation (EU) 2024/1689"
    url: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj"
lastReviewed: "2026-10-14"
---

# 7.4 Release Gates and Documentation

## The problem

Launch is Thursday. On Monday the guardrail team's evaluation shows the new agent's false negative rate on the critical-harm suite at 14%, against a target of 10% that was written down three months ago. The product manager argues that the number is "close", that the competitor launched last week, and that a fix can follow in the next sprint. The guardrail lead believes the launch should wait. The engineering director is on leave. On Wednesday evening someone posts "ok to ship?" in the launch channel, a vice president replies with a thumbs-up, and the agent ships.

Six weeks later, an incident review asks who accepted the 14% and on what basis. Nobody can produce a decision. The vice president thought the guardrail team had signed off. The guardrail lead thought the thumbs-up was an override. The 10% target was in a planning document but nothing said who could waive it, and nobody wrote down who could have stopped the launch.

The evaluation worked. The governance did not: there was no agreed gate, no record of the risk being accepted, and no documented authority to say no.

## Why it happens

- **Incentives point one way.** Launch dates have owners and visible costs. Residual risk usually has neither until an incident.
- **Responsibility diffuses.** When many people could object, each assumes someone else is accountable. An undocumented decision is one nobody owns.
- **Criteria move after the results.** If the threshold is debated after the number is known, it tends to land just below the number.
- **Evidence is scattered.** Evaluation results, threat models, red-team findings, and monitoring readiness live in different tools, and nobody assembles them into one decision.
- **Stop authority is assumed, not granted.** Engineers are often told they "can always raise concerns", which is not the same as being able to stop something. In an incident, an undocumented right to pull the brake turns into a discussion about whether you are allowed to.

The NIST AI RMF 1.0 (January 2023) puts accountability structures in its Govern function for this reason: roles, responsibilities, and lines of authority for AI risk are documented, and decisions about residual risk are made by people with the authority to make them.

## Control patterns

### 1. Go/no-go criteria, fixed before evaluation (human, enforced deterministically)

Write the criteria when the release is planned, version them with the system, and have the release gate check them automatically where possible. Each criterion names the evidence that satisfies it.

| Criterion (illustrative) | Type | Evidence |
|---|---|---|
| Estimated false negative rate on each critical-harm category at or below 10%, from at least the minimum sample size set in the evaluation plan, with the 95% confidence interval reported | Blocking | Evaluation report from the CI suite ([6.1](/training/module/evaluation-and-red-teaming/designing-evaluations), [6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)) |
| Attack success rate on the injection suite, measured over repeated trials, at or below the target in the threat model | Blocking | Red-team and regression results ([6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)) |
| Over-refusal rate on the benign set at or below its target | Blocking | Evaluation report |
| Every route, client, and tool path enumerated in the architecture passes the coverage test | Blocking | Coverage test output |
| Deterministic controls verified: tool permissions, egress allowlist, action approvals | Blocking | Tests and configuration review ([5.1](/training/module/agent-containment-and-control/least-privilege-for-agents), [5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)) |
| Production monitoring live: probes, coverage check, relative alerts ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)) | Blocking | Alert config and a test page |
| Emergency brake drilled within the last 90 days and stop authority register current | Blocking | Drill record ([7.2](/training/module/operations-and-governance/incident-response-and-disclosure)) |
| Threat model reviewed for this release ([2.6](/training/module/risk-and-threat-modeling/risk-scoring-and-threat-model-documents)) | Blocking | Threat model version and reviewer |
| No open SEV1 or SEV2 incidents on this system | Blocking | Incident tracker |
| p95 guardrail latency at or below the 300 ms SLO under load | Advisory | Performance test ([6.6](/training/module/evaluation-and-red-teaming/regression-and-ci)) |
| System card complete and reviewed | Blocking | System card version |

A blocking criterion that fails means no-go unless a risk acceptance record covers the gap. An advisory criterion is reported and discussed but does not stop the release by itself. The 10% false negative red line is the same value the monitoring in 7.1 pages on after launch, so the system ships and runs against one standard.

### 2. System cards (human)

A system card describes a deployed system, not just a model. Model cards (Mitchell et al., 2019) introduced the practice of documenting intended use, evaluation conditions, and known limitations for models; a system card extends it to the whole deployment, including guardrails, tools, and operations. Its readers are reviewers at the gate, incident responders, auditors, and, in a shorter public form, users and customers.

| Section | Contents |
|---|---|
| Purpose and scope | Intended uses, explicitly out-of-scope uses, users, deployment context |
| Architecture | Model and version, prompts, tools and their permissions, data sources, routes |
| Guardrails | Each control, its layer, what it covers, and its known limits |
| Evaluation results | Metrics against the go/no-go criteria, with dates, dataset versions, and confidence intervals |
| Known limitations and residual risks | Each with a link to its risk acceptance record |
| Operations | Monitoring, alert owners, incident runbook, stop authority register |
| Change history | Config bundle and model versions per release ([7.3](/training/module/operations-and-governance/change-management)) |

### 3. Risk acceptance records (human)

When a blocking criterion fails and the business wants to ship anyway, or a known gap will not be fixed, someone accepts the residual risk in writing. A risk acceptance record is the artifact that the opening scenario was missing.

| Field | Why |
|---|---|
| Risk description and the failed criterion | What exactly is being accepted, in terms a non-specialist can read |
| Measured value and evidence link | The 14% and the report it came from |
| Impact if it goes wrong | From the threat model's scoring ([2.6](/training/module/risk-and-threat-modeling/risk-scoring-and-threat-model-documents)) |
| Compensating controls | What reduces the risk in the meantime (for example, human review on the riskiest category, a lower usage cap, a narrower launch population) |
| Owner and signer | A named person who owns the business consequence and has authority at the required level, not the engineer who measured it |
| Guardrail team position | The guardrail owner's recommendation, recorded whether or not it was followed |
| Expiry date | Acceptance lapses; the risk must be fixed or re-accepted |
| Revocation conditions | Events that void the acceptance immediately (for example, an incident in this category, or the measured rate rising above a stated value) |

Set signing levels by risk: a team lead might accept a low-rated risk, while a high-rated risk needs the accountable executive for the product. The guardrail engineer's job is to make the risk legible and record a position. Signing for the business is the owner's job. An engineer who signs a risk acceptance for a business they do not run has taken on accountability without authority.

### 4. Stop authority (human, enforced deterministically)

There are two different powers, and both must be written down before they are needed.

**Authority to stop a launch.** The guardrail owner (or the security or safety lead, depending on the organization) holds a veto when a blocking criterion fails. The veto can only be overridden by a named accountable executive, and the override is itself a risk acceptance record with that executive as signer. A thumbs-up in a chat channel is not an override.

**Authority to stop a running system.** Pulling the emergency brake ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)) is open to a wider group: the guardrail on-call, the incident commander, the security on-call, and the system owner. They may stop the system *without asking first* when they believe it is causing or about to cause serious harm, and they explain afterwards. The asymmetry is deliberate:

| | Stop | Resume |
|---|---|---|
| Who | Any holder on the register, acting alone | System owner and guardrail owner together |
| Prior approval | None | Required |
| Evidence | Reasonable belief of serious harm | Containment in place, cause understood, regression tests added |
| Record | Incident record, written afterwards | Resume decision in the incident record |

Making stopping cheap and resuming deliberate means the brake gets pulled when it should be. Organizations should also state that pulling the brake in good faith is not penalized when it turns out to be unnecessary. Otherwise people will hesitate.

The EU AI Act's human oversight article (Article 14(4)(e)) expects that people overseeing a high-risk AI system can "intervene in the operation of the high-risk AI system or interrupt the system through a 'stop' button or a similar procedure that allows the system to come to a halt in a safe state." The 2026 Digital Omnibus amendment (Regulation (EU) 2026/1744) postponed when most high-risk obligations apply (see [7.5](/training/module/operations-and-governance/regulation-and-standards)), but the engineering expectation is clear and worth meeting for any system that can act.

Authority without a mechanism means nothing. Every holder on the register must have working access to the brake (see 5.5 for designing one that sits outside the model's reach), and the brake drill in 7.2 tests both the mechanism and the people.

## Implementation

### Stop authority register

```yaml
# Part of the system card; versioned with the system (illustrative)
system: shopping-assistant
launch_veto:
  holder: { role: "Guardrail owner", name: "A. Rivera", deputy: "K. Osei" }
  override_by: { role: "VP Product, Commerce", name: "J. Lindqvist" }
  override_record: "risk acceptance record, signed by override_by"
runtime_stop:
  holders:
    - { role: "Guardrail on-call", via: "pager rotation guardrail-primary" }
    - { role: "Incident commander", via: "incident rotation" }
    - { role: "Security on-call", via: "pager rotation sec-primary" }
    - { role: "System owner", name: "M. Chen" }
  prior_approval_required: false
  mechanism: "brake service: pause agents, revoke tool credentials (see 5.5 runbook)"
  resume_requires: ["System owner", "Guardrail owner"]
  good_faith_protection: true
last_drill: "2026-09-02"
review_by: "2027-03-01"
```

### Release gate check

```python
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Criterion:
    criterion_id: str
    blocking: bool
    passed: bool | None          # None means no evidence was produced


@dataclass(frozen=True)
class RiskAcceptance:
    criterion_id: str
    signer_role: str
    expires: date
    revoked: bool


def gate(criteria: list[Criterion], acceptances: list[RiskAcceptance],
         authorized_signers: dict[str, set[str]], today: date) -> tuple[bool, list[str]]:
    """Return (go, reasons). Missing evidence fails; only valid acceptances waive."""
    if not criteria:
        return False, ["no criteria defined"]
    reasons: list[str] = []
    for c in criteria:
        if c.passed is True:
            continue
        status = "no evidence" if c.passed is None else "failed"
        if not c.blocking:
            reasons.append(f"advisory {c.criterion_id}: {status}")
            continue
        allowed = authorized_signers.get(c.criterion_id, set())
        waived = any(
            a.criterion_id == c.criterion_id
            and a.signer_role in allowed
            and not a.revoked
            and a.expires > today
            for a in acceptances
        )
        if waived:
            reasons.append(f"blocking {c.criterion_id}: {status}, covered by risk acceptance")
        else:
            reasons.append(f"blocking {c.criterion_id}: {status}, NO valid acceptance")
            return False, reasons
    return True, reasons
```

The gate treats missing evidence as a failure, rejects acceptances signed by someone outside the authorized roles for that criterion, and rejects expired or revoked acceptances. What it cannot do is judge whether an acceptance was wise; that stays with the people named in it.

## Where it breaks

- **Gaming the evaluation.** If the suite is fixed and well known, a system can be tuned to pass it without being safer. Refresh evaluation sets and include held-out red-team results ([6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)).
- **Routine waivers.** If most launches ship under risk acceptances, the gate has become a formality. Track the acceptance rate and the number of open acceptances per system on the leadership dashboard ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)).
- **The wrong signer.** An acceptance signed by someone who does not own the consequence spreads accountability without making anyone accountable. The gate can check roles, not judgment.
- **Stale documents.** A system card or stop authority register written at launch and never updated describes a system that no longer exists. Tie updates to the change process (7.3) and give each document a review date.
- **Authority that is never exercised.** A documented veto that is never used, or always overridden, does not protect anything. Organizational culture decides whether the register is real. The drill and the override records are how you find out.
- **Single points of failure.** If the only veto holder is on leave, the launch either waits or the veto quietly disappears. Name deputies.
- **No mechanism behind the authority.** Being allowed to stop a system is useless if the brake is broken or the holder lacks access. Test both in drills.

## Lab exercise

In [Lab 7](/labs/lab-7-operate-and-respond), Task 7.4, you run a release gate against a set of evaluation results, find that a blocking criterion fails, write the risk acceptance record and system card section for it, and complete a stop authority register for the system.

## Check your understanding

1. The critical-harm false negative rate is 14% against a 10% blocking criterion. The product manager signs a risk acceptance. What should the gate do, and what would you check?
2. Why should anyone on the runtime stop list be able to pull the brake without prior approval, while resuming needs two named owners?
3. A release gate script treats a criterion with no evidence as "not failed." Why is that a problem?
4. List four fields of a risk acceptance record and explain why the expiry date matters.

<details>
<summary>Answers</summary>

1. The gate should accept the waiver only if the product manager is an authorized signer for that criterion at that risk level, and the acceptance is unexpired and not revoked. For a high-rated risk, the authorized signer is likely the accountable executive, not the PM. Also check that compensating controls are listed and that the guardrail team's position is recorded.
2. Stopping is reversible and time-sensitive: a delay while seeking approval is when harm happens, so the cost of an unnecessary stop is low and the cost of a late one is high. Resuming reintroduces the risk, so it needs evidence that containment is in place and the cause is understood, approved by the people accountable for the system.
3. Missing evidence would pass the gate, so a broken evaluation pipeline or a skipped test produces a "go." Treat no evidence as a failure.
4. For example: the risk and failed criterion, the measured value with evidence, compensating controls, the named signer, the guardrail team's position, the expiry date, and the revocation conditions. Expiry forces the risk to be fixed or re-accepted, so a temporary exception does not become permanent by default.

</details>
