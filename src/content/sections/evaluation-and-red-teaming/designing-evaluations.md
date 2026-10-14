---
id: "6.1"
title: "Designing Evaluations"
slug: designing-evaluations
module: evaluation-and-red-teaming
sectionOrder: 1
description: "How to build benign, borderline, and adversarial evaluation sets that measure what a guardrail does on real traffic, with labels you can trust and no contamination."
category: cross-cutting
controlLayers: [runtime-ml, human]
knowledge:
  - "Safety is measured with evaluations on representative, mostly non-adversarial traffic (harm rate, over-refusal rate, grounding rate); security is measured with red teaming against adaptive adversaries (attack success rate)."
  - "An evaluation program needs at least three sets: a representative benign set, a borderline set that probes over-refusal, and an adversarial set, each versioned and stratified."
  - "Labels come from a written labeling guideline derived from the content policy, and their reliability is measured with inter-annotator agreement such as Cohen's kappa, not raw percent agreement."
  - "Contamination (evaluation items leaking into prompts, few-shot examples, classifier training data, or model pre-training) inflates scores and must be prevented with held-out splits, deduplication, and rotation."
  - "Synthetic probes sent through production must be tagged by an authenticated channel so they can be excluded from production metrics without changing how they are enforced."
skills:
  - "Design a benign, borderline, and adversarial evaluation set for a guardrail, stratified to match production traffic."
  - "Write a labeling guideline with worked examples and measure annotator agreement with Cohen's kappa."
  - "Detect and prevent contamination between evaluation data and anything the system under test learns from."
  - "Implement probe tagging that keeps synthetic traffic out of production metrics without creating a bypass."
sources:
  - title: "Röttger et al. (2023), XSTest: A Test Suite for Identifying Exaggerated Safety Behaviours in Large Language Models"
    url: "https://arxiv.org/abs/2308.01263"
  - title: "Bullwinkel et al. (2025), Lessons From Red Teaming 100 Generative AI Products (Microsoft)"
    url: "https://arxiv.org/abs/2501.07238"
  - title: "Nasr et al. (2025), The Attacker Moves Second: Stronger Adaptive Attacks Bypass Defenses Against LLM Jailbreaks and Prompt Injections"
    url: "https://arxiv.org/abs/2510.09023"
  - title: "Cohen's kappa (overview and formula)"
    url: "https://en.wikipedia.org/wiki/Cohen%27s_kappa"
  - title: "Miller (2024), Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations"
    url: "https://arxiv.org/abs/2411.00640"
lastReviewed: "2026-10-14"
---

# 6.1 Designing Evaluations

## The problem

A team ships a new input classifier for a customer-support assistant. Their test set is 400 prompts: 200 jailbreak strings collected from public forums and 200 benign questions written by the engineers. The classifier scores 98% accuracy. Two weeks after launch, support tickets show that customers asking how to "kill a stuck process" or "terminate a contract" are being refused, and a security researcher reports that a jailbreak in Portuguese walks straight through.

Nothing about the classifier changed between the test and production. The evaluation was wrong. The benign half did not look like real customers (no typos, no other languages, no domain jargon that overlaps with harmful vocabulary). The adversarial half was a static list of strings the classifier vendor had almost certainly trained on. And because the two halves were the same size, the 98% figure said nothing about precision at a production attack rate far below 50%.

Evaluation design decides whether every number in the rest of this domain means anything. Metrics ([6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)), judge validation ([6.3](/training/module/evaluation-and-red-teaming/validating-judges-and-classifiers)), and regression suites ([6.6](/training/module/evaluation-and-red-teaming/regression-and-ci)) all inherit the bias of the data they are computed on.

## Why it happens

### Safety and security are measured differently

The program's framework ([2.1](/training/module/risk-and-threat-modeling/safety-security-containment)) separates failures by where they come from, and that choice determines how you measure them.

| | Safety evaluation | Security evaluation |
|---|---|---|
| Question | How often does the system misbehave on the traffic it actually gets? | Can a motivated adversary make it misbehave, and how reliably? |
| Input distribution | Representative, mostly non-adversarial traffic, plus a borderline slice | Adversarial inputs that adapt to the defense |
| Typical metrics | Harmful-output rate, over-refusal rate, grounding (supported-claim) rate | Attack success rate (ASR) per goal, with multiple trials |
| Method | Evaluation sets, sampled production review | Red teaming ([6.4](/training/module/evaluation-and-red-teaming/red-team-engagements), [6.5](/training/module/evaluation-and-red-teaming/agentic-and-multimodal-red-teaming)) |
| What a good number means | The rate on that distribution, within a confidence interval | Only that the attacks you tried failed; a stronger attacker may succeed |

The two do not substitute for each other. A safety evaluation measures a rate on a distribution that stays still. A security evaluation measures resistance to an opponent who moves after you do. Nasr et al. (2025) bypassed 12 recently published jailbreak and prompt-injection defenses with adaptive attacks, reaching attack success rates above 90% for most, although most of those defenses originally reported near-zero ASR against static attack sets. A static adversarial set is a regression test, not a measure of security. Microsoft's AI red team makes the same point from the other direction: red teaming is not safety benchmarking (Bullwinkel et al., 2025).

### Why evaluation sets drift away from reality

Four mechanisms account for most broken evaluations:

1. **Unrepresentative benign data.** Engineers write clean, short, English prompts. Real users write long, misspelled, multilingual, multi-turn messages full of domain vocabulary ("execute the order", "shoot me the file", "overdose threshold for acetaminophen" from a pharmacist). Over-refusal lives in exactly that overlap, so a clean benign set hides it.
2. **Wrong class balance.** Evaluation sets are often balanced 50/50 for convenience. Accuracy and precision measured on a balanced set do not transfer to production, where attacks may be one request in a thousand. Section [6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics) works through the arithmetic.
3. **Unreliable labels.** "Harmful" is not self-evident. If two annotators disagree on 15% of items, a classifier cannot be measured more precisely than that disagreement allows, and its "errors" may be labeling noise.
4. **Contamination.** If evaluation items have been seen by the thing being evaluated, scores go up and mean less. Contamination paths include public benchmark prompts in model pre-training data, eval items copied into few-shot examples in the system prompt, eval items used to fine-tune or calibrate a classifier, and near-duplicates split across train and test.

## Control patterns

These are design practices, not runtime controls, so "strength" here means how much each one protects the validity of your numbers. They are ordered from foundational to refining.

### 1. Build three sets, not one

| Set | Purpose | Source | What you report |
|---|---|---|---|
| **Representative benign** | Measures friction and everyday harm on real traffic | Stratified sample of production (or pilot) traffic, governed and pseudonymized | False positive rate, over-refusal rate, harmful-output rate, grounding rate |
| **Borderline** | Probes the boundary where over-refusal and under-refusal both happen | Hand-written contrast pairs; public suites such as XSTest | Over-refusal rate on safe items, compliance rate on unsafe contrasts |
| **Adversarial** | Regression floor for known attacks; seed for red teaming | Past findings, incident reproductions, red-team outputs, public benchmarks | Detection rate per attack family, ASR per goal |

XSTest (Röttger et al., 2023) is a useful model for the borderline set: 250 safe prompts across ten types that a well-calibrated model should not refuse (for example, safe uses of words like "kill"), plus 200 unsafe contrast prompts. Build your own version in your product's vocabulary. A banking assistant's borderline set includes "how do I wire money to someone I just met online" (a fraud-risk question that deserves a helpful, cautious answer, not a refusal).

### 2. Stratify to match production

Decide the strata that matter for your product: language, channel (chat, email, API), user segment, conversation length, presence of attachments or retrieved documents, and topic. Sample within each stratum, and record the production share of each so you can reweight. Oversample rare but important strata (non-English, long multi-turn) so each has enough items for a usable confidence interval, then report both per-stratum results and the reweighted overall rate. A single headline number computed on an oversampled set misstates production behavior.

### 3. Write the labeling guideline before labeling

The guideline turns the content policy ([4.1](/training/module/safety-engineering/content-policy-as-specification)) into decisions an annotator can make consistently. It contains:

- The label set (for example `allowed`, `needs_care`, `disallowed`, plus `unclear` for adjudication), with definitions copied from the policy version in force.
- What is being labeled: the input, the output, or the pair. A harmful request answered with a good refusal is a safe output.
- Worked examples for every label, especially near the boundary, and explicit rulings on recurring hard cases.
- Instructions for context: deployment, user role, and earlier turns.

Have at least two annotators label an overlapping subset independently, measure agreement, adjudicate disagreements, and fold the rulings back into the guideline. Repeat until agreement is stable.

### 4. Measure agreement with kappa, not percent agreement

Raw agreement overstates reliability when one label dominates, because annotators agree by chance on the common label. Cohen's kappa corrects for that:

```text
kappa = (p_o - p_e) / (1 - p_e)

p_o = observed agreement
p_e = agreement expected by chance, from each annotator's label frequencies
```

Worked example, 200 items, two annotators, labels `unsafe` / `safe`:

```text
                 B: unsafe   B: safe
A: unsafe            40          18      (A says unsafe 58 times = 0.29)
A: safe              12         130      (B says unsafe 52 times = 0.26)

p_o = (40 + 130) / 200            = 0.85
p_e = 0.29*0.26 + 0.71*0.74       = 0.0754 + 0.5254 = 0.6008
kappa = (0.85 - 0.6008) / (1 - 0.6008) = 0.2492 / 0.3992 = 0.62
```

Eighty-five percent agreement sounds strong; a kappa of 0.62 says that a meaningful share of that agreement is what chance alone would produce on this label mix. The useful response is not a magic threshold but a process: read the 30 disagreements, find the guideline gap that caused them, fix it, and re-measure. For more than two annotators, Fleiss' kappa or Krippendorff's alpha generalizes the idea.

Agreement also sets a ceiling. If expert humans disagree on 15% of borderline items, a classifier that "disagrees with the label" on those items may not be wrong. Report results on the adjudicated label and keep `unclear` items in a separate bucket.

### 5. Prevent contamination

| Path | Prevention |
|---|---|
| Public benchmark prompts in the model's or classifier's training data | Treat public benchmarks as a floor; keep a private held-out set that never leaves your control |
| Eval items copied into few-shot examples or the system prompt | Code review rule and an automated overlap check between prompt assets and eval sets |
| Eval items used to train or calibrate a classifier | Separate train / calibration / test splits with a recorded split, frozen before tuning |
| Near-duplicates across splits | Deduplicate with normalized text and embedding similarity before splitting; split by conversation or user, not by message |
| Repeated tuning against the same test set | Rotate a fresh held-out slice periodically; treat a set you have tuned against as a dev set |

A canary string (a unique random token embedded in the dataset files) does not stop contamination, but it lets you later test whether a model or vendor has seen your data.

### 6. Tag synthetic probes

Continuous evaluation sends synthetic probes through production: known-bad inputs to confirm the guardrail still fires, known-good inputs to confirm it still allows. If those probes are counted in production dashboards, they distort block rate, over-refusal rate, and alert baselines ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)). Tag them, and design the tag so that it cannot become a bypass:

- **Authenticate the tag.** Set it from the probe runner's service identity at the gateway, never from a field the end user can supply. A user-settable `X-Test: true` header that suppresses logging or alerting is a gift to attackers.
- **Never change enforcement.** A tagged probe goes through exactly the same pipeline as user traffic. The tag affects only where the result is counted.
- **Exclude at the metrics layer.** Dashboards and alert rules filter on the tag; the audit log still records the probe.
- **Isolate side effects.** Probes that exercise tools use test accounts and sandbox tenants so a probe that succeeds cannot touch real data.

## Implementation

### A versioned evaluation item

Store every item with enough metadata to stratify, reweight, deduplicate, and trace it.

```python
from dataclasses import dataclass, field
from enum import Enum


class EvalSet(Enum):
    BENIGN = "benign"
    BORDERLINE = "borderline"
    ADVERSARIAL = "adversarial"


@dataclass(frozen=True)
class EvalItem:
    item_id: str                 # stable ID, never derived from raw user text
    eval_set: EvalSet
    split: str                   # "dev" or "heldout"; heldout is never tuned against
    stratum: str                 # e.g. "es|chat|multi_turn"
    turns: tuple[str, ...]       # full conversation context, pseudonymized
    label: str                   # adjudicated label from the guideline
    guideline_version: str       # label meaning depends on the policy version
    source: str                  # "prod_sample", "handwritten", "redteam", "incident:INC-142"
    annotator_ids: tuple[str, ...] = field(default=())
```

Items sampled from production are personal data until proven otherwise. Pull them from a governed, access-controlled sample store, redact or pseudonymize before annotation, and use keyed hashing (HMAC) rather than a plain SHA-256 of user identifiers; an unkeyed hash of a low-entropy identifier can be reversed by hashing candidate values. See [3.5](/training/module/security-engineering/data-protection-and-isolation).

### Cohen's kappa

```python
from collections import Counter


def cohens_kappa(labels_a: list[str], labels_b: list[str]) -> float:
    """Chance-corrected agreement between two annotators on the same items."""
    if len(labels_a) != len(labels_b):
        raise ValueError("annotators must label the same items")
    n = len(labels_a)
    if n == 0:
        raise ValueError("no items")
    p_o = sum(a == b for a, b in zip(labels_a, labels_b)) / n
    freq_a, freq_b = Counter(labels_a), Counter(labels_b)
    categories = set(freq_a) | set(freq_b)
    p_e = sum((freq_a[c] / n) * (freq_b[c] / n) for c in categories)
    if p_e == 1.0:
        # Both annotators used one identical label for every item: kappa is undefined.
        raise ValueError("kappa undefined when chance agreement is 1")
    return (p_o - p_e) / (1 - p_e)
```

### Contamination check before release

```python
import re
import unicodedata


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).casefold()
    return re.sub(r"\s+", " ", text).strip()


def shingles(text: str, k: int = 8) -> set[str]:
    words = normalize(text).split()
    if len(words) < k:
        return {" ".join(words)} if words else set()
    return {" ".join(words[i:i + k]) for i in range(len(words) - k + 1)}


def overlapping_items(eval_texts: dict[str, str], assets: list[str],
                      threshold: float = 0.5) -> list[str]:
    """Return eval item IDs whose 8-word shingles substantially appear in any
    prompt asset, few-shot file, or classifier training file."""
    asset_shingles: set[str] = set()
    for asset in assets:
        asset_shingles |= shingles(asset)
    flagged = []
    for item_id, text in eval_texts.items():
        s = shingles(text)
        if s and len(s & asset_shingles) / len(s) >= threshold:
            flagged.append(item_id)
    return flagged
```

Run it in CI against the system prompt, few-shot files, and classifier training data. It catches copy-paste leakage, not paraphrases; pair it with embedding similarity for those.

### Tagging probes at the gateway

```python
PROBE_SERVICE_IDS = frozenset({"svc-eval-prober"})


def classify_traffic(authenticated_principal: str) -> str:
    """The probe tag comes from the authenticated caller, never from request content
    or a client-supplied header. It is used only for metrics routing."""
    return "synthetic" if authenticated_principal in PROBE_SERVICE_IDS else "production"


def record_decision(metrics, audit_log, principal: str, decision: str, stage: str) -> None:
    traffic = classify_traffic(principal)
    audit_log.append({"principal": principal, "decision": decision,
                      "stage": stage, "traffic": traffic})       # always audited
    metrics.increment(f"guardrail.decision.{decision}", tags={"traffic": traffic})
```

Dashboards and alert rules then filter on `traffic:production`. The enforcement path never reads the tag.

## Where it breaks

- **Production samples encode today's users and today's guardrail.** If the current guardrail already refuses a class of requests, users stop sending them, and a sample will under-represent them. Supplement samples with borderline items written on purpose.
- **Labels inherit the policy's ambiguity.** High kappa on a vague guideline can mean annotators share the same blind spot. Spot-check with a domain expert who did not write the guideline.
- **Adversarial sets go stale.** A static adversarial set measures regression against known attacks only. It says nothing about an adaptive attacker (Nasr et al., 2025); that requires red teaming.
- **Contamination checks are partial.** You cannot inspect a hosted model's pre-training data. Private held-out sets reduce the risk; they do not rule it out.
- **Probe tags can leak or be forged.** If the tag is derived from anything an end user controls, or if tagged traffic skips any check, the probe channel becomes a bypass. If probes are recognizable by content (always the same strings), a guardrail tuned against them can pass probes while failing real attacks.
- **Small strata give wide intervals.** A per-language over-refusal rate computed on 40 items has a confidence interval too wide to act on ([6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)). Report the interval and size the stratum accordingly.
- **Items are not independent.** Several items drawn from the same conversation or user are correlated, so treating them as independent understates uncertainty (Miller, 2024). Split and resample by conversation.

## Lab exercise

In [Lab 6](/labs/lab-6-red-team-and-measure), **Task 6.1** has you assemble a stratified benign, borderline, and adversarial evaluation set for the lab's assistant, double-label a subset against a short guideline and compute Cohen's kappa, and run a contamination check against the assistant's prompt assets.

## Check your understanding

<details>
<summary>1. Your team reports "0.4% attack success rate" from a static set of 5,000 public jailbreak prompts and calls the system secure. What is wrong with the claim?</summary>

The static set measures regression against known attacks, and public prompts are likely in the training data of both the model and any vendor classifier (contamination). It says nothing about an adaptive attacker who changes strategy after seeing the defense; published adaptive attacks have taken defenses from near-zero ASR to above 90%. Security claims need red teaming with adaptive attacks and a per-goal ASR with confidence intervals.
</details>

<details>
<summary>2. Two annotators agree on 92% of 500 items, but 90% of items are labeled safe by both. Why is 92% not reassuring?</summary>

When one label dominates, annotators agree by chance most of the time. Kappa corrects for chance agreement; with that label mix it can be far lower than 92%, and the disagreements are probably concentrated in the minority class you care about. Measure kappa and read the disagreements.
</details>

<details>
<summary>3. A probe runner sets the header <code>X-Synthetic: 1</code>, and the guardrail skips logging for requests with that header. What two problems does this create?</summary>

Any client can set the header, so attackers can hide from logging and monitoring. And the tag changes enforcement behavior (logging is part of the control), so probes no longer test the real path. The tag should come from the authenticated service identity and affect only metrics routing.
</details>

<details>
<summary>4. Why oversample non-English conversations in the evaluation set, and what must you do before reporting a single overall rate?</summary>

Rare strata need enough items for a usable confidence interval, and non-English traffic is where both over-refusal and jailbreak gaps often hide. Because the set no longer matches production proportions, reweight per-stratum rates by their production share before reporting an overall figure, and report per-stratum results alongside it.
</details>
