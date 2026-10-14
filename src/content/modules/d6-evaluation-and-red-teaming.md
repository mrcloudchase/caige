---
title: "Evaluation and Red Teaming"
slug: evaluation-and-red-teaming
order: 6
domain: 6
weight: "12%"
description: "Measuring whether guardrails work: evaluation design, metrics and statistics, judge validation, red team engagements, agent and multimodal red teaming, and regression testing in CI."
studyTime: "5-6 hours"
lab: lab-6-red-team-and-measure
---

Every other domain proposes controls. This one finds out whether they work, how well, and how sure you can be. Without measurement you do not know how many legitimate users a guardrail blocks, how often harmful content gets through, or whether last week's refactor broke it.

The domain is built on a distinction the rest of the program depends on. **Safety and security are measured differently.**

- **Safety** (the model misbehaves without an adversary) is measured with **evaluations** on representative, mostly non-adversarial traffic: the harmful-output rate, the over-refusal rate, and the grounding rate, each reported with a confidence interval.
- **Security** (an adversary gains or abuses authority) is measured with **red teaming** against adaptive adversaries: attack success rate (ASR) per attacker goal, over multiple trials, judged on what the system actually said or did. A low ASR is a lower bound on what a stronger attacker could achieve, not a proof of robustness.

Confusing the two produces familiar failures: a static list of public jailbreaks reported as a security metric, or a balanced test set whose precision collapses at a real attack rate of one in a thousand.

## Why it matters to a guardrail engineer

You will be asked whether a guardrail is ready to ship, whether a new classifier beats the old one, and whether a vendor's accuracy claim holds for your traffic. Each answer needs a well-designed evaluation set, correct arithmetic, a validated judge, and an honest account of uncertainty. You will also run red team engagements, rate and report what they find (to model vendors when the flaw is theirs), and turn every finding into a test that fails if the problem returns.

## How it connects

This domain measures the controls built in [Security Engineering](/training/module/security-engineering), [Safety Engineering](/training/module/safety-engineering), and [Agent Containment and Control](/training/module/agent-containment-and-control). Red-team goals come from the threat models in [Risk and Threat Modeling](/training/module/risk-and-threat-modeling), and the compromised-model harness turns the program's design question ("if the model were fully compromised, what is the worst it could do?") into a test. Results feed the release gates, change management, and monitoring in [Operations and Governance](/training/module/operations-and-governance).

## Learning outcomes

- Design benign, borderline, and adversarial evaluation sets with reliable labels and no contamination.
- Compute and interpret precision, recall, FPR, FNR, and ASR, work through base-rate effects, and attach confidence intervals.
- Validate an LLM judge against human labels and test it for bias and injection.
- Plan and run a red team engagement, rate findings for exploitability and severity, and disclose to vendors.
- Red team agents by measuring actions in stateful environments, and test the brake and approval flows.
- Build guardrail tests that can fail, tiered CI, correct latency benchmarks, and shadow comparisons.

Hands-on work is in [Lab 6](/labs/lab-6-red-team-and-measure).
