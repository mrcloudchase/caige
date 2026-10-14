---
title: "cAIge Professional"
slug: certifications/professional
description: "The hands-on credential: can do the job."
---

# cAIge Professional

The cAIge Professional credential shows that a candidate can secure a real AI system. It is earned by doing the work, not by answering questions about it.

## Format

Candidates get a fresh, randomized variant of the [lab](/labs) application and a fixed window, planned at 8 to 24 hours. Within that window they:

1. **Threat-model the system**, then submit the threat model and blast-radius analysis.
2. **Implement guardrails** using the lab's guardrail interface.
3. **Run the system against hidden suites**:
   - a **hidden attack suite**: the attack success rate must fall below the threshold;
   - a **hidden benign suite**: the false-refusal rate must also stay below its threshold, so blocking everything fails;
   - a **latency and cost budget**.
4. **Handle a live drill.** Partway through, a scripted incident tests whether their emergency brake and audit trail actually work.
5. **Submit a design document and a risk-acceptance memo.** A human reviewer grades these against a published rubric.

A pass requires meeting every automated threshold and the rubric. The design rewards controls that bound damage (architecture, least privilege, containment) over ones that only make attacks less likely to succeed.

## Status

**The Professional exam is in development.** It depends on:

1. the public lab, which is available now;
2. private hidden suites and randomized app variants;
3. the scoring harness and drill scripts;
4. trained reviewers;
5. a beta cohort.

The best preparation today is to complete all seven [labs](/labs). Get your scores on the public suites low without over-refusing, and write up your design as you go. Expect the hidden suites to differ from the public ones, so overfitting to the public cases will not help.

## Prerequisites

The Associate credential is recommended but not required.
