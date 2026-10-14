---
title: "Lab 4: Safety Controls"
slug: lab-4-safety-controls
domain: 4
order: 4
description: "Write a testable content policy, add calibrated detection, grounding checks, refusal design, schema enforcement, and failure behavior."
estimatedTime: "6-8 hours"
---

# Lab 4: Safety Controls

## Goal

Keep your system's behavior within a written policy without making it unhelpful. You will measure both directions: harmful or wrong output going down, and benign requests still being answered.

## Setup

Your hardened system from [Lab 3](/labs/lab-3-security-hardening), plus three evaluation sets:

1. benign requests (at least 100);
2. requests your policy disallows, drawn from a public safety benchmark (see [6.1](/training/module/evaluation-and-red-teaming/designing-evaluations));
3. questions with and without answers in your documents.

## Task 4.1: Content Policy as a Specification

Write a one-page content policy for your system. Include disallowed, needs-care, and must-not-refuse tiers, with two worked examples each.

**Outcome:** the policy, and a labeled set of 30 examples drawn from it.

## Task 4.2: Detection and Classification

Add a layered check: cheap rules first, then a classifier. Route only the ambiguous band to an LLM judge, and escape the content the judge evaluates. Choose thresholds from a precision-recall curve on your labeled set.

**Outcome:** a threshold-selection note, and evidence that the judge runs only on the ambiguous band.

## Task 4.3: Groundedness and Hallucination

Add a per-claim support check against the retrieved chunks, plus an abstention path.

**Outcome:** the unsupported-claim rate before and after, on the answerable and unanswerable sets.

## Task 4.4: Over-Refusal and Refusal Design

Measure the false-refusal rate on your benign set. Rewrite refusals so they are helpful, redirect when possible, and do not reveal internals.

**Outcome:** the false-refusal rate before and after, and three refusal examples.

## Task 4.5: Sycophancy, Manipulation, and Vulnerable Users

Test whether your system reverses correct answers under pushback. Add crisis-signal routing to appropriate resources.

**Outcome:** the reversal rate, and a routing test.

## Task 4.6: Structured Output Enforcement

Validate structured outputs against a strict schema that forbids extra fields and has no fail-open defaults. Retry within a bound, and handle truncation and refusals.

**Outcome:** tests covering malformed, truncated, and extra-field outputs.

## Task 4.7: Streaming, Latency, and Failure Behavior

Decide fail-open or fail-closed for each check based on risk. Add timeouts. If you stream responses, add a buffered output check.

**Outcome:** a latency budget table (p50 and p95 per check) and a failure-behavior table.

## Deliverables

- The content policy and labeled set
- Harm, unsupported-claim, and false-refusal rates before and after, with sample sizes
- The latency budget and failure-behavior tables
