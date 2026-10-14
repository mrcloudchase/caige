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

This domain defines the vocabulary the rest of the program uses. Each failure and each control is placed on two axes. The first is **category**:

- **Safety**: the model misbehaves with no adversary.
- **Security**: an adversary gains or abuses authority, usually by borrowing authority it does not hold in the system/developer > user > tool and retrieved-content hierarchy.
- **Containment**: cause-agnostic controls that limit, observe, and stop a model whatever the reason it misbehaves.

The second axis is **control layer**, from weakest to strongest: model, prompt, runtime ML, deterministic, human. Strength means how much of a control's guarantee survives if the model is fully compromised. A system prompt survives none of it. A database role without delete permission survives all of it.

The rest of the domain turns that vocabulary into a working threat model. You list every principal that can influence the system, including retrieved content, tools, the model provider, and the model itself. You mark every trust boundary, including the two most often missed: tool results flowing back into the context window, and model output flowing to browsers and downstream systems. You go through a catalog of failure modes, from hallucination and over-refusal to indirect injection, memory poisoning, and denial of wallet, and map them to OWASP, MITRE ATLAS, NIST, and STRIDE with versions stated. You then apply the program's central design test: **"If the model were fully compromised, what is the worst it could do?"**

## Why it matters to a guardrail engineer

Most guardrail failures are failures of placement, not effort. A team adds a toxicity classifier when the real exposure is an agent that can read a mailbox and render links, or writes "never issue large refunds" in a prompt when the refund API accepts any amount. Threat modeling is how you find the control that bounds the worst case before you spend time on controls that only lower its frequency. It also gives you the documents your organization needs: a scored, owned list of risks and a record of who accepted the ones you did not fix.

## How this domain connects to the others

Domain 1 supplies the mechanisms behind each failure, especially the single token stream that makes injection possible. Domains 3, 4, and 5 hold the controls for security, safety, and containment respectively, and their sections are linked from the failure mode catalog here. Domain 6 tests whether those controls hold against the threats you identified, and Domain 7 keeps the threat model current as models, prompts, and tools change.

## Learning outcomes

After this domain you should be able to:

1. Classify any failure by mechanism and impact, and name the strongest control layer that addresses it.
2. Enumerate principals, assign authority from authentication rather than content, and draw a data-flow diagram with every trust boundary.
3. Use the failure mode catalog to cover a system systematically, and map it to OWASP LLM 2025, OWASP Agentic 2026, MITRE ATLAS, and NIST AI 600-1.
4. Perform a blast-radius analysis, find lethal-trifecta exposure, and redesign to shrink the worst case.
5. Score risks for a specific use case, write a threat model document, and set up risk acceptance and review triggers.

In [Lab 2: Threat Model](/labs/lab-2-threat-model) you produce a complete threat model for a realistic support agent, from principals and boundaries to scored risks and signed acceptances.
