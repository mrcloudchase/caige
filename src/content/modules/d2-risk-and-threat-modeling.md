---
title: "Risk and Threat Modeling"
slug: risk-and-threat-modeling
order: 2
domain: 2
weight: "15%"
description: "The program's organizing framework (safety, security, containment, and the control-strength ladder), plus the methods for mapping principals and trust boundaries, cataloging failures, applying frameworks, analyzing blast radius, and scoring and documenting risk."
studyTime: "4-5 hours"
lab: lab-2-threat-model
---

# Risk and Threat Modeling

This domain defines the vocabulary the whole program uses. Every failure and control sits on two axes. The first is **category**:

- **Safety**: the model misbehaves with no adversary.
- **Security**: an adversary gains or abuses authority, often borrowing authority it lacks in the system/developer > user > tool/retrieved-content hierarchy.
- **Containment**: cause-agnostic controls that limit, observe, and stop a model whatever the reason it misbehaves.

The second axis is **control layer**, from weakest to strongest: model, prompt, runtime ML, deterministic, human. Strength means how much of a control's guarantee survives a fully compromised model.

The rest of the domain turns that vocabulary into a working threat model. You list every principal, including retrieved content, tools, the model provider, and the model itself, and mark every trust boundary, including tool results flowing back into context and model output flowing to browsers and downstream systems. You work through a catalog of failure modes and map it to OWASP, MITRE ATLAS, NIST, and STRIDE with versions stated. Then you apply the central design test: **"If the model were fully compromised, what is the worst it could do?"**

## Why it matters to a guardrail engineer

Most guardrail failures are failures of placement, not effort: a toxicity classifier where the real exposure is an agent that can read a mailbox and render links, or "never issue large refunds" in a prompt when the refund API accepts any amount. Threat modeling finds the control that bounds the worst case before you spend effort on controls that only lower its frequency, and it produces a scored, owned list of risks with a record of who accepted the rest.

## How this domain connects to the others

Domain 1 supplies the mechanisms behind each failure, especially the single token stream. Domains 3, 4, and 5 hold the security, safety, and containment controls that the failure mode catalog links to. Domain 6 tests those controls against your threats, and Domain 7 keeps the threat model current.

## Learning outcomes

After this domain you should be able to:

1. Classify any failure by mechanism and impact, and name its strongest control layer.
2. Enumerate principals, assign authority from authentication rather than content, and draw a data-flow diagram with every trust boundary.
3. Use the failure mode catalog to cover a system systematically, and map it to OWASP LLM 2025, OWASP Agentic 2026, MITRE ATLAS, and NIST AI 600-1.
4. Perform a blast-radius analysis, find lethal-trifecta exposure, and redesign to shrink the worst case.
5. Score risks for a specific use case, write a threat model document, and set up risk acceptance and review triggers.

In [Lab 2: Threat Model](/labs/lab-2-threat-model) you build a complete threat model for a support agent.
