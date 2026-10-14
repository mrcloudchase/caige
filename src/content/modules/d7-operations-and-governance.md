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

The earlier domains teach you to design controls. This domain is about what happens after those controls ship: the guardrail you tuned last quarter is now running against traffic you have never seen, behind a model the provider updated last week, owned by a team that is under pressure to launch the next feature. Guardrails decay through neglect, unreviewed changes, and missing authority long before an attacker gets clever.

A guardrail engineer who can only build controls is an advisor. A guardrail engineer who can also see when those controls fail, contain a live bypass, block an unsafe change, refuse a launch, and stop a running system holds real authority in the organization. That authority has to be written down before it is needed. A stop decision made during an incident by someone whose right to make it was never documented gets argued about, and the arguing costs hours.

This domain covers five areas:

- **Seeing failure.** Which operational signals show that a guardrail has stopped working, why alerts should use relative changes against a baseline, and how to keep a reviewable sample of real traffic without building an ungoverned pile of user data.
- **Responding to failure.** Severity for AI incidents, containment options that actually reduce exposure during an active bypass, forensics from audit logs, regression tests that keep a fixed bypass fixed, and disclosure to users, regulators, and the wider industry.
- **Changing safely.** Guardrail configuration as code, re-validation whenever a model, prompt, or policy changes, canary and shadow releases that check detection and not only error rates, rollback, and guardrail debt.
- **Deciding.** Go/no-go criteria, system cards, risk acceptance records with named owners and expiry dates, and who holds the authority to stop a launch or a running system.
- **Proving.** Mapping engineering controls to the EU AI Act (Regulation (EU) 2024/1689, as amended in 2026), NIST AI RMF 1.0, NIST AI 600-1, ISO/IEC 42001:2023, and privacy law, and producing the evidence auditors ask for.

## How it connects

Domain 7 operates everything the earlier domains build. Domain 2's threat models and risk scores become the risk acceptance records signed here. The detectors from Domains 3 and 4 produce the block rates and probe results you monitor. The emergency brake from [5.5](/training/module/agent-containment-and-control/the-emergency-brake) and the audit log from [5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit) are the tools incident response depends on. Domain 6's metrics, evaluation suites, and CI regression tests become the gate criteria and the canary probes used in release decisions.

## Learning outcomes

After this domain you should be able to:

- Design monitoring that catches a silent guardrail failure, with alert thresholds expressed as relative changes and a governed sample store for review.
- Run an AI incident from detection through containment, forensics, regression testing, and disclosure.
- Ship guardrail changes as versioned configuration through monitor-only, shadow, and canary stages with relative rollback criteria and labeled attack probes.
- Write go/no-go criteria, a system card, and a risk acceptance record, and document who can stop a launch or a running system.
- Map a system's controls to the regulatory and standards obligations that apply to it as of October 2026, and name the evidence each one requires.
