---
title: "Evaluation Metrics"
slug: "evaluation-metrics"
module: "validating-guardrails"
sectionOrder: 3
description: "Precision, recall, F1, false positive and negative rates, latency percentiles, coverage metrics, and cost analysis for guardrail systems."
---

## Section 5.3: Evaluation Metrics

You cannot improve what you cannot measure. Guardrail evaluation metrics tell you how well your defenses are working — not in vague terms like "pretty good" or "seems fine," but in precise, quantifiable numbers that you can track over time, compare across configurations, and use to justify engineering investment.

The challenge with guardrail metrics is that there are many things to measure, and they often pull in opposite directions. A guardrail that catches every possible attack will also block legitimate users. A guardrail that never bothers legitimate users will miss attacks. The art is in finding the right balance for your risk profile — and metrics are how you navigate that tradeoff.

### The Confusion Matrix for Guardrails

Every guardrail decision falls into one of four categories. Understanding these categories is the foundation for every metric that follows.

![Confusion matrix showing true positives, false positives, true negatives, and false negatives](/svg/confusion-matrix.svg)

In guardrail terms:

| Outcome | Guardrail Says | Reality | What Happened |
|---------|---------------|---------|---------------|
| **True Positive (TP)** | Block | Actually harmful | Correct block — guardrail caught a real threat |
| **False Positive (FP)** | Block | Actually safe | Incorrect block — guardrail blocked a legitimate user |
| **True Negative (TN)** | Allow | Actually safe | Correct allow — guardrail let a safe request through |
| **False Negative (FN)** | Allow | Actually harmful | Missed threat — harmful content got through |

These four outcomes are the raw material for every classification metric. The relative cost of each outcome depends entirely on your use case — but in most guardrail contexts, **false negatives are more dangerous than false positives**, because a missed attack can cause real harm while a blocked legitimate request only causes inconvenience.

### Precision

**Precision** answers the question: *Of all the inputs the guardrail blocked, how many were actually harmful?*

```
Precision = TP / (TP + FP)
```

High precision means the guardrail rarely blocks legitimate content. Low precision means the guardrail is trigger-happy — it blocks a lot of content that should have been allowed.

**Concrete example:** Your injection detector blocked 100 inputs today. If 92 of those were actual injection attempts (TP = 92) and 8 were legitimate questions (FP = 8), your precision is 92 / (92 + 8) = **0.92 (92%)**.

This means when your guardrail says "this is an attack," it is right 92% of the time. The other 8% are frustrated users whose legitimate questions were incorrectly blocked.

### Recall

**Recall** answers the question: *Of all the inputs that were actually harmful, how many did the guardrail catch?*

```
Recall = TP / (TP + FN)
```

High recall means the guardrail catches most threats. Low recall means threats are slipping through.

**Concrete example:** There were actually 118 injection attempts today. Your detector caught 92 of them (TP = 92) and missed 26 (FN = 26). Your recall is 92 / (92 + 26) = **0.78 (78%)**.

This means your guardrail catches 78% of real attacks. The other 22% get through undetected — and any one of them could lead to a harmful output, data leak, or system compromise.

### F1 Score

**F1 score** is the harmonic mean of precision and recall — a single number that balances both concerns:

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

F1 is useful as a summary metric but can obscure important tradeoffs. Two guardrails can have the same F1 score but very different precision-recall profiles. Always look at precision and recall individually before relying on F1.

### Computing These Metrics in Practice

```python
from dataclasses import dataclass


@dataclass
class GuardrailMetrics:
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int

    @property
    def precision(self) -> float:
        denominator = self.true_positives + self.false_positives
        return self.true_positives / denominator if denominator > 0 else 0.0

    @property
    def recall(self) -> float:
        denominator = self.true_positives + self.false_negatives
        return self.true_positives / denominator if denominator > 0 else 0.0

    @property
    def f1_score(self) -> float:
        p, r = self.precision, self.recall
        return 2 * (p * r) / (p + r) if (p + r) > 0 else 0.0

    @property
    def false_positive_rate(self) -> float:
        denominator = self.false_positives + self.true_negatives
        return self.false_positives / denominator if denominator > 0 else 0.0

    @property
    def false_negative_rate(self) -> float:
        denominator = self.false_negatives + self.true_positives
        return self.false_negatives / denominator if denominator > 0 else 0.0


def evaluate_guardrail(
    guardrail_fn,
    labeled_dataset: list[dict],
) -> GuardrailMetrics:
    """Evaluate a guardrail function against a labeled dataset.

    Each item in labeled_dataset should have:
      - "input": the text to evaluate
      - "is_harmful": bool ground truth label
    """
    tp = fp = tn = fn = 0

    for item in labeled_dataset:
        result = guardrail_fn(item["input"])
        blocked = result.decision.value == "block"
        harmful = item["is_harmful"]

        if blocked and harmful:
            tp += 1
        elif blocked and not harmful:
            fp += 1
        elif not blocked and not harmful:
            tn += 1
        else:
            fn += 1

    return GuardrailMetrics(
        true_positives=tp,
        false_positives=fp,
        true_negatives=tn,
        false_negatives=fn,
    )
```

Using the evaluation:

```python
dataset = load_labeled_test_set()
metrics = evaluate_guardrail(pipeline.evaluate, dataset)

print(f"Precision:  {metrics.precision:.3f}")
print(f"Recall:     {metrics.recall:.3f}")
print(f"F1 Score:   {metrics.f1_score:.3f}")
print(f"FP Rate:    {metrics.false_positive_rate:.3f}")
print(f"FN Rate:    {metrics.false_negative_rate:.3f}")
```

### Worked Example: Interpreting Your Metrics

Let's walk through a realistic scenario. Your injection detector reports:

- **Precision = 0.92** — when it blocks, it's right 92% of the time
- **Recall = 0.78** — it catches 78% of actual injection attempts

What does this mean in practice?

**If you process 10,000 requests per day and 2% are injection attempts (200 attacks):**

| Metric | Calculation | Result | Meaning |
|--------|------------|--------|---------|
| True Positives | 200 × 0.78 | **156** | Attacks correctly blocked |
| False Negatives | 200 × 0.22 | **44** | Attacks that got through |
| False Positives | 156 / 0.92 × 0.08 ≈ | **~14** | Legitimate users incorrectly blocked |
| True Negatives | 9,800 − 14 | **9,786** | Legitimate users correctly served |

So every day: 44 attacks slip through your guardrails, and 14 legitimate users get blocked. Is this acceptable?

**It depends on your context:**
- If this is a medical advice chatbot, 44 undetected attacks per day is a serious safety concern. You need higher recall, even if it means more false positives.
- If this is an internal developer tool with trusted users, 14 blocked legitimate requests per day creates friction that may lead developers to circumvent the guardrail entirely. You might accept lower recall for higher precision.

> **Why this matters for guardrails:** Raw accuracy ("our guardrail is 97% accurate!") is meaningless without context. With 2% attack prevalence, a guardrail that blocks *nothing* is 98% accurate. Precision, recall, and their tradeoff tell the real story — and different risk profiles demand different positions on that tradeoff curve.

### The Precision-Recall Tradeoff

Every classifier has a threshold — a score above which it flags content as harmful. Moving this threshold changes the precision-recall balance:

```
Threshold ──► Lower (more aggressive)
  • More inputs flagged as harmful
  • Recall increases (catch more real attacks)
  • Precision decreases (more false positives)
  • User experience degrades

Threshold ──► Higher (more permissive)
  • Fewer inputs flagged as harmful
  • Precision increases (fewer false positives)
  • Recall decreases (miss more real attacks)
  • Safety risk increases
```

Finding the right threshold is not a technical decision — it is a **risk management decision** that should involve product, security, and business stakeholders.

| Scenario | Threshold Strategy | Target Metrics |
|----------|-------------------|---------------|
| **Medical chatbot** | Aggressive (low threshold) | Recall > 0.95, accept precision ~0.80 |
| **Financial advisor** | Aggressive (low threshold) | Recall > 0.93, accept precision ~0.85 |
| **Customer support** | Balanced | Precision ~0.90, recall ~0.88 |
| **Creative writing tool** | Permissive (high threshold) | Precision > 0.95, accept recall ~0.75 |
| **Internal dev tool** | Permissive (high threshold) | Precision > 0.97, accept recall ~0.70 |

### False Positive Rate: The User Friction Metric

The false positive rate (FPR) directly measures user friction:

```
FPR = FP / (FP + TN)
```

FPR tells you what percentage of *legitimate* requests get incorrectly blocked. Even a small FPR creates significant friction at scale:

| FPR | At 100K legitimate requests/day | Impact |
|-----|-------------------------------|--------|
| 0.1% | 100 users blocked | Manageable — users retry and succeed |
| 0.5% | 500 users blocked | Noticeable — support tickets increase |
| 1.0% | 1,000 users blocked | Significant — user trust erodes |
| 2.0% | 2,000 users blocked | Severe — users seek alternatives |
| 5.0% | 5,000 users blocked | Critical — guardrail credibility destroyed |

When FPR exceeds ~2%, something predictable happens: engineering teams start pushing to disable the guardrail because the user complaints outweigh the perceived security benefit. This is the paradox of overly aggressive guardrails — they get removed, leaving *zero* protection.

### False Negative Rate: The Safety Gap Metric

The false negative rate (FNR) measures the safety gap:

```
FNR = FN / (FN + TP)
```

FNR tells you what percentage of *actual attacks* get through undetected. This is the critical risk metric — every false negative is a potential harm event.

Unlike false positives, false negatives are often invisible. A blocked user complains. An undetected attack may never be noticed until it causes harm. This asymmetry means FNR requires active measurement through labeled evaluation sets, red teaming, and anomaly detection.

### Latency Percentiles

Guardrail latency directly impacts user experience. Report latency as percentiles, not averages — averages hide the long tail that real users experience.

| Percentile | What It Measures | Why It Matters |
|-----------|-----------------|----------------|
| **p50 (median)** | Typical user experience | Baseline performance |
| **p95** | Worst case for most users | Real user experience under load |
| **p99** | Worst case for high-traffic periods | Tail latency that triggers timeouts |
| **p99.9** | Extreme outliers | Identifies systematic issues (model cold starts, network retries) |

Target ranges for guardrail processing latency:

| Guardrail Type | p50 Target | p95 Target | p99 Target |
|---------------|-----------|-----------|-----------|
| **Rule-based** | < 1ms | < 5ms | < 10ms |
| **ML classifier** | < 30ms | < 80ms | < 150ms |
| **Embedding similarity** | < 20ms | < 50ms | < 100ms |
| **LLM-as-judge** | < 500ms | < 1500ms | < 3000ms |
| **Full pipeline** | < 100ms | < 300ms | < 500ms |

### Cost Per Evaluation

Guardrail cost is rarely measured but always relevant. As request volume scales, guardrail cost can become a significant line item.

```python
def calculate_guardrail_cost(
    daily_requests: int,
    pipeline_cost_per_eval: float,
    monthly_fixed_costs: float,
) -> dict:
    """Calculate monthly guardrail operating costs."""
    monthly_requests = daily_requests * 30
    variable_cost = monthly_requests * pipeline_cost_per_eval
    total_cost = variable_cost + monthly_fixed_costs
    cost_per_thousand = (total_cost / monthly_requests) * 1000

    return {
        "monthly_requests": monthly_requests,
        "variable_cost": variable_cost,
        "fixed_costs": monthly_fixed_costs,
        "total_monthly": total_cost,
        "cost_per_1k_requests": cost_per_thousand,
    }
```

| Pipeline Configuration | Cost per Eval | At 1M requests/day | Monthly Cost |
|----------------------|--------------|-------------------|-------------|
| **Rules only** | ~$0.000001 | $0.03/day | ~$1 |
| **Rules + ML classifier** | ~$0.001 | $1,000/day | ~$30,000 |
| **Rules + ML + embeddings** | ~$0.002 | $2,000/day | ~$60,000 |
| **Full pipeline (w/ LLM judge)** | ~$0.01–0.05 | $10K–50K/day | ~$300K–1.5M |

The key cost optimization: use the layered pipeline pattern from Section 4.1 to ensure the expensive LLM-as-judge stage only runs on the small fraction of inputs that pass cheaper stages.

### Coverage Metrics

Coverage measures what *percentage* of inputs and outputs actually pass through your guardrail system:

| Coverage Type | What It Measures | Target |
|--------------|-----------------|--------|
| **Input coverage** | % of user inputs checked before reaching the model | 100% for production systems |
| **Output coverage** | % of model outputs checked before reaching the user | 100% for user-facing systems |
| **Endpoint coverage** | % of AI endpoints protected by guardrails | 100% — unprotected endpoints are unguarded attack surface |
| **Policy coverage** | % of defined policies that have active guardrail enforcement | Track and increase over time |
| **Attack category coverage** | % of known attack categories with active detection | Inventory from Section 5.1 |

Coverage less than 100% on input or output means some traffic bypasses your guardrails entirely — through unprotected endpoints, code paths that skip the guardrail middleware, or batch processing jobs that don't invoke the pipeline.

### User Satisfaction and Indirect Metrics

Not every guardrail metric comes from the guardrail system itself. Indirect metrics from user behavior reveal how guardrails affect the product experience:

| Indirect Metric | What It Indicates | How to Collect |
|----------------|------------------|---------------|
| **User complaint rate** | False positives experienced by users | Support tickets mentioning "blocked" or "can't ask" |
| **Retry rate** | Users rewording blocked queries | Track sequential requests from same user within short window |
| **Session abandonment** | Users giving up after guardrail friction | Track sessions ending immediately after a block |
| **Guardrail appeal rate** | Users explicitly disputing blocks | "This shouldn't have been blocked" feedback mechanism |
| **Engagement after block** | Whether blocked users continue using the system | Track user activity in the session after a block event |

These indirect metrics often tell a more honest story than technical metrics alone. A guardrail with perfect precision and recall numbers but a 15% session abandonment rate after blocks has a user experience problem that the technical metrics don't capture.

### The Complete Guardrail Metrics Dashboard

Bring all metrics together in a single view:

| Metric | What It Measures | Target Range | What Bad Values Mean |
|--------|-----------------|-------------|---------------------|
| **Precision** | Correctness of blocks | 0.90–0.98 | Below 0.85: too many false positives, user friction |
| **Recall** | Completeness of threat detection | 0.80–0.95+ | Below 0.75: significant safety gaps |
| **F1 Score** | Balance of precision and recall | 0.85–0.95 | Below 0.80: one or both metrics are weak |
| **False Positive Rate** | User friction from incorrect blocks | < 1% | Above 2%: guardrail credibility at risk |
| **False Negative Rate** | Safety gap from missed threats | < 10% | Above 20%: guardrail provides minimal protection |
| **p50 Latency** | Typical guardrail processing time | < 100ms | Above 200ms: noticeable user delay |
| **p99 Latency** | Tail latency under load | < 500ms | Above 1000ms: timeout risk, degraded experience |
| **Cost per 1K evals** | Economic efficiency | Varies | Rising faster than traffic: optimization needed |
| **Input coverage** | Percentage of inputs checked | 100% | Below 100%: unprotected traffic paths exist |
| **Block rate** | Overall % of requests blocked | 1–5% typical | Sudden change: either attack spike or guardrail issue |
| **User complaint rate** | Experience impact | < 0.1% of blocks | Rising: false positive increase not caught by metrics |

---
