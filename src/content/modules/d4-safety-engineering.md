---
title: "Safety Engineering"
slug: safety-engineering
order: 4
domain: 4
weight: "20%"
description: "Controls for the failures a model produces with no adversary involved: content policy, detection, groundedness, over-refusal, sycophancy and vulnerable users, structured output, and guardrail behavior under streaming, latency limits, and outages."
studyTime: "7-9 hours"
lab: lab-4-safety-controls
---

# Safety Engineering

Safety failures need no attacker. An airline chatbot invents a refund policy and the airline is ordered to honor it. A lawyer files a brief citing cases that do not exist. A model update makes an assistant agree with whatever its users already believe. In each case the model produced fluent, plausible text that nobody had checked against a specification.

This domain starts with the specification, because a guardrail cannot enforce a policy nobody wrote down precisely. It then covers detecting violations with layered checks, verifying that answers are supported by their sources, and measuring when a system refuses too much. It covers the hardest human-facing cases: sycophancy, users in crisis, minors, and high-stakes advice. It ends with the mechanics that decide whether any of this works in production: structured output that fails closed, and guardrails that hold up under streaming, tight latency budgets, and outages.

## Why it matters to a guardrail engineer

Wrong answers, harmful answers, and needless refusals make up much of what users see go wrong, and they are where teams most often rely on a classifier or a system prompt alone. This domain teaches you to state the policy precisely, pick the right detector for each part of it, set thresholds from measured costs, and decide in advance what happens when a check is uncertain, slow, or unavailable.

## How this domain connects to the others

Domain 1 explains why models hallucinate and why outputs vary even at temperature 0. Domain 2 catalogs these failure modes. Domain 3 uses the same classifiers and schemas against adversaries and owns prompt injection, PII, and output encoding. Domain 5 bounds what an agent can do when these probabilistic controls miss. Domain 6 measures them, and Domain 7 monitors and changes them safely.

## Learning outcomes

After this domain you should be able to:

1. Write a content policy that engineers can implement and test, with tiers, worked examples, deployment overlays, and versioning.
2. Build a layered detection pipeline with calibrated scores, explicit thresholds, and an injection-resistant judge, and choose where to integrate it.
3. Check groundedness per claim and per source chunk, verify citations deterministically, and design abstention.
4. Measure over-refusal and write refusals that help the user without exposing the system's internals.
5. Evaluate sycophancy, route crisis signals to human resources, and apply stricter handling for minors and high-stakes advice.
6. Enforce structured output with strict schemas that fail closed, bounded retries, and encoded templates.
7. Guard streamed output, set latency budgets, and choose fail-open or fail-closed behavior by risk.

In [Lab 4: Safety Controls](/labs/lab-4-safety-controls) you add these controls to the course application and measure harmful-output and false-refusal rates as you go.
