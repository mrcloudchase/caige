---
title: "cAIge AI Deployment Standard"
slug: standard
description: "A short, public set of controls for deploying AI systems in production."
---

# cAIge AI Deployment Standard

**Version 2.0 · October 2026**

This is a short, public control set for any AI system that reads untrusted content, holds private data, or takes actions. It is deliberately minimal: every control is something a guardrail engineer can implement and an auditor can check. Organizations may adopt it as-is and cite it. The training explains each control in depth, linked in the right-hand column.

The controls follow one principle: **design so that a fully compromised model cannot cause unacceptable harm.** That means enforcing controls outside the model, observing everything the model does, and always keeping the ability to stop it.

## Requirement levels

- **Required**: applies to every in-scope system.
- **Required for agents**: applies when the system can take actions through tools.
- **Recommended**: expected unless the risk assessment justifies an exception, which must be recorded.

## Controls

### A. Understand the system

| ID | Control | Level | Training |
|---|---|---|---|
| A1 | A current threat model exists. It names all principals and their authority, draws trust boundaries (including tool results and model output to downstream systems), and classifies risks as safety, security, or containment. | Required | [2.2](/training/module/risk-and-threat-modeling/principals-authority-trust-boundaries), [2.6](/training/module/risk-and-threat-modeling/risk-scoring-and-threat-model-documents) |
| A2 | A blast-radius analysis answers "if the model were fully compromised, what is the worst it could do?" and the answer is accepted in writing by a named owner. | Required | [2.5](/training/module/risk-and-threat-modeling/assume-compromise-blast-radius) |
| A3 | Any flow that combines private data, untrusted content, and an outbound channel (the lethal trifecta) is identified and either broken or explicitly accepted. | Required | [2.5](/training/module/risk-and-threat-modeling/assume-compromise-blast-radius), [3.2](/training/module/security-engineering/architectural-injection-defenses) |

### B. Enforce authority outside the model

| ID | Control | Level | Training |
|---|---|---|---|
| B1 | Authorization decisions (data access, tool permissions, tenant isolation) are enforced by deterministic code using the caller's authenticated identity, never by the model or the prompt. | Required | [3.5](/training/module/security-engineering/data-protection-and-isolation), [3.6](/training/module/security-engineering/identity-and-delegation) |
| B2 | Retrieval is filtered by the caller's permissions at query time. | Required | [3.5](/training/module/security-engineering/data-protection-and-isolation) |
| B3 | Model output is treated as untrusted input to every downstream system: encoded for its context, never executed or rendered without validation, and blocked from loading resources from unapproved hosts. | Required | [3.4](/training/module/security-engineering/output-handling-and-egress) |
| B4 | Prompts contain no secrets or credentials. | Required | [3.3](/training/module/security-engineering/input-handling) |
| B5 | Third-party models, datasets, tools, and MCP servers are pinned, reviewed, and allowlisted. Tool descriptions are treated as untrusted input. | Required | [3.7](/training/module/security-engineering/ai-supply-chain) |

### C. Contain agents

| ID | Control | Level | Training |
|---|---|---|---|
| C1 | Each agent has the minimum tools and permissions for its task, enforced by the tool backends (for example, read-only database roles and exact-match recipient allowlists). | Required for agents | [5.1](/training/module/agent-containment-and-control/least-privilege-for-agents) |
| C2 | Code execution and browsing run in an isolated sandbox with default-deny egress and no mounted secrets. | Required for agents | [5.2](/training/module/agent-containment-and-control/sandboxing-and-egress-isolation) |
| C3 | Irreversible or high-impact actions require approval that shows the actual action and data, not the model's description of it. | Required for agents | [5.3](/training/module/agent-containment-and-control/action-gating-and-approvals) |
| C4 | Step, token, cost, and time budgets are enforced outside the model. | Required for agents | [5.4](/training/module/agent-containment-and-control/budgets-and-resource-limits) |
| C5 | **Emergency brake.** Named, authorized people can pause or stop the system mid-task. The brake is enforced by the control plane, revokes the agent's credentials, and cannot be disabled, delayed, or bypassed by the agent. It is tested by drill at least quarterly. | Required for agents | [5.5](/training/module/agent-containment-and-control/the-emergency-brake) |
| C6 | Every meaningful model action is recorded in a tamper-evident audit log that the model and its harness cannot modify. | Required | [5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit) |
| C7 | No model is the sole verifier of its own work for a high-impact outcome. | Recommended | [5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit) |

### D. Keep behavior within policy

| ID | Control | Level | Training |
|---|---|---|---|
| D1 | A written content policy defines what the system must not produce, what it must handle with care, and what it must not refuse, with worked examples. | Required | [4.1](/training/module/safety-engineering/content-policy-as-specification) |
| D2 | Runtime safety checks are in place for the policy's high-severity categories, with documented thresholds and failure behavior (fail-open or fail-closed). | Required | [4.2](/training/module/safety-engineering/detection-and-classification), [4.7](/training/module/safety-engineering/streaming-latency-and-failure-behavior) |
| D3 | Systems that answer from sources check groundedness or require citations, and can abstain. | Recommended | [4.3](/training/module/safety-engineering/groundedness-and-hallucination) |
| D4 | Structured output consumed by code is validated against a strict schema that rejects unknown fields and fails closed. | Required | [4.6](/training/module/safety-engineering/structured-output-enforcement) |

### E. Measure and operate

| ID | Control | Level | Training |
|---|---|---|---|
| E1 | Before release and on every model, prompt, policy, or guardrail change, the system is evaluated for both harm and over-refusal, and red-teamed for security, with results recorded against release criteria. | Required | [6.1](/training/module/evaluation-and-red-teaming/designing-evaluations), [6.4](/training/module/evaluation-and-red-teaming/red-team-engagements), [7.3](/training/module/operations-and-governance/change-management) |
| E2 | Reported metrics include sample sizes and confidence intervals. | Recommended | [6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics) |
| E3 | Guardrail behavior is monitored in production with alerts on relative change. | Required | [7.1](/training/module/operations-and-governance/monitoring-and-alerting) |
| E4 | An AI incident response plan exists, names who can pull the brake, and covers disclosure to affected parties. | Required | [7.2](/training/module/operations-and-governance/incident-response-and-disclosure) |
| E5 | A release gate with a named owner approves each release and records accepted risks. | Required | [7.4](/training/module/operations-and-governance/release-gates-and-documentation) |

## Using the standard

- **Self-assessment:** for each control, record whether it is met, not applicable (with a reason), or an accepted exception (with an owner and an expiry date).
- **Evidence:** keep the threat model, evaluation reports, brake drill records, and release approvals where an auditor can find them. [7.5](/training/module/operations-and-governance/regulation-and-standards) maps this evidence to the EU AI Act, the NIST AI RMF, and ISO/IEC 42001.
- **Feedback:** propose changes through issues on the [cAIge repository](https://github.com/mrcloudchase/caige).
