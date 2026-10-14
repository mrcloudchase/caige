---
title: "Operations and Governance"
slug: operations-and-governance
order: 7
domain: 7
weight: "8%"
description: "Running guardrails in production and holding real authority over AI releases: monitoring, incident response and disclosure, change management, release gates, stop authority, and mapping controls to regulation."
studyTime: "3-4 hours"
lab: lab-7-operate-and-respond
---

# Operations and Governance

The earlier domains teach you to design controls. This domain covers what happens after they ship: the guardrail you tuned last quarter now runs against unfamiliar traffic, behind a model the provider updated last week, owned by a team under pressure to launch. Guardrails often decay through neglect, unreviewed changes, and missing authority before an attacker gets clever.

A guardrail engineer who can only build controls is an advisor. One who can also see when controls fail, contain a live bypass, block an unsafe change, refuse a launch, and stop a running system holds real authority. That authority has to be written down before it is needed, or it gets argued about mid-incident while the harm continues.

This domain covers five areas:

- **Seeing failure.** Signals that show a guardrail has stopped working, relative-change alerting, and a governed sample of real traffic for review.
- **Responding to failure.** Severity, containment that actually reduces exposure during a bypass, forensics from audit logs, regression tests, and disclosure to users, regulators, and the industry.
- **Changing safely.** Configuration as code, re-validation on every model, prompt, or policy change, canaries that check detection, rollback, and guardrail debt.
- **Deciding.** Go/no-go criteria, system cards, risk acceptance records with named owners and expiry dates, and who holds the authority to stop a launch or a running system.
- **Proving.** Mapping engineering controls to the EU AI Act (Regulation (EU) 2024/1689, as amended in 2026), NIST AI RMF 1.0, NIST AI 600-1, ISO/IEC 42001:2023, and privacy law, and producing the evidence auditors ask for.

## How it connects

Domain 7 operates what the earlier domains build. Domain 2's threat models become the risk acceptance records signed here. Detectors from Domains 3 and 4 produce the block rates and probe results you monitor. Incident response depends on the emergency brake ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)) and the audit log ([5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)). Domain 6's evaluation suites become release gate criteria and canary probes.

## Learning outcomes

After this domain you should be able to:

- Design monitoring that catches a silent guardrail failure, with alert thresholds expressed as relative changes and a governed sample store for review.
- Run an AI incident from detection through containment, forensics, regression testing, and disclosure.
- Ship guardrail changes as versioned configuration through monitor-only, shadow, and canary stages with relative rollback criteria and labeled attack probes.
- Write go/no-go criteria, a system card, and a risk acceptance record, and document who can stop a launch or a running system.
- Map a system's controls to the regulatory and standards obligations that apply to it as of October 2026, and name the evidence each one requires.
